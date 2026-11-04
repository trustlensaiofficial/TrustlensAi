/**
 * The detection benchmark, as a regression test.
 *
 * `scripts/benchmark-detection.mjs` prints the full table for a human.
 * This asserts **floors**, so a later change cannot silently degrade
 * detection — which is the failure mode that matters, because nobody notices
 * recall dropping until a real message gets through.
 *
 * Why floors rather than exact figures: pinning the current numbers would
 * make every rule improvement a test failure, and would quietly encourage
 * tuning the corpus to the detector instead of the other way round. The
 * floors below sit under today's measured values with room to spare, and the
 * one assertion with no slack at all is zero false positives — a detector
 * that cries wolf is worse than one that misses, because people stop reading
 * it.
 *
 * Deterministic rules only: no network, no model. The figure describes the
 * engine's own behaviour, not the AI layer's.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { analyze } from '../lib/analysis/orchestrator';
import { CORPUS, LANGUAGES, type CorpusCase, type Language } from './fixtures/corpus';

beforeEach(() => {
  delete process.env.AI_GATEWAY_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
});

/**
 * A case counts as flagged at `high_risk` or `elevated_risk`.
 *
 * `some_signals` deliberately does not count. It is the engine saying "worth
 * a look", which is not a warning, and counting it as a detection would
 * inflate recall by moving the goalposts rather than by detecting more.
 */
const FLAGGED = new Set(['high_risk', 'elevated_risk']);

interface Scored extends CorpusCase {
  flagged: boolean;
  level: string;
  score: number;
}

let scored: Scored[];

async function scoreCorpus(): Promise<Scored[]> {
  const out: Scored[] = [];
  for (const c of CORPUS) {
    const report = await analyze({
      text: c.text,
      context: c.context ?? 'generic',
      liveChecks: false,
      allowCloudAI: false,
    });
    out.push({
      ...c,
      flagged: FLAGGED.has(report.assessment.level),
      level: report.assessment.level,
      score: report.assessment.signalScore,
    });
  }
  return out;
}

function metrics(rows: Scored[]) {
  const tp = rows.filter((r) => r.scam && r.flagged).length;
  const fp = rows.filter((r) => !r.scam && r.flagged).length;
  const fn = rows.filter((r) => r.scam && !r.flagged).length;
  const tn = rows.filter((r) => !r.scam && !r.flagged).length;
  return {
    tp, fp, fn, tn,
    precision: tp + fp === 0 ? 1 : tp / (tp + fp),
    recall: tp + fn === 0 ? 1 : tp / (tp + fn),
  };
}

describe('the corpus itself', () => {
  it('is balanced enough for the numbers to mean anything', async () => {
    const scam = CORPUS.filter((c) => c.scam).length;
    const benign = CORPUS.length - scam;
    // A corpus that is nearly all scams would let a flag-everything detector
    // score well, so the benign half has to stay substantial.
    expect(benign).toBeGreaterThanOrEqual(Math.floor(CORPUS.length * 0.35));
    expect(scam).toBeGreaterThanOrEqual(Math.floor(CORPUS.length * 0.35));
  });

  it('covers every language in the roadmap', () => {
    for (const lang of LANGUAGES) {
      const cases = CORPUS.filter((c) => c.language === lang);
      expect(cases.length, lang).toBeGreaterThan(0);
      // Each language needs both labels, or its recall figure is unfalsifiable.
      expect(cases.some((c) => c.scam), `${lang} has no scam case`).toBe(true);
      expect(cases.some((c) => !c.scam), `${lang} has no benign case`).toBe(true);
    }
  });

  it('has no duplicate ids', () => {
    expect(new Set(CORPUS.map((c) => c.id)).size).toBe(CORPUS.length);
  });
});

describe('measured performance', () => {
  beforeEach(async () => {
    scored ??= await scoreCorpus();
  });

  it('raises no false alarm on any benign message', () => {
    const alarms = scored.filter((r) => !r.scam && r.flagged);
    // The assertion with no slack. A product that flags ordinary life — a
    // delivery notice, a friend asking for money back, its own safety advice —
    // teaches people to ignore it, and then it is worse than nothing.
    expect(alarms.map((r) => `${r.id} → ${r.level}`)).toEqual([]);
  });

  it('keeps precision at or above 95%', () => {
    expect(metrics(scored).precision).toBeGreaterThanOrEqual(0.95);
  });

  it('keeps recall at or above 90%', () => {
    expect(metrics(scored).recall).toBeGreaterThanOrEqual(0.9);
  });

  it('keeps recall at or above 80% in every language', () => {
    // Per-language, because an overall figure can hide one language scoring
    // zero — which is exactly what the first run of this benchmark found for
    // Tamil script and Devanagari.
    for (const lang of LANGUAGES) {
      const m = metrics(scored.filter((r) => r.language === lang));
      expect(m.recall, `${lang} recall`).toBeGreaterThanOrEqual(0.8);
    }
  });

  it('separates the two classes by score, not just by label', () => {
    const benignMax = Math.max(...scored.filter((r) => !r.scam).map((r) => r.score));
    const scamMedian = scored
      .filter((r) => r.scam)
      .map((r) => r.score)
      .sort((a, b) => a - b)[Math.floor(scored.filter((r) => r.scam).length / 2)]!;
    // A healthy margin means the threshold is not balanced on a knife edge.
    expect(scamMedian).toBeGreaterThan(benignMax);
  });
});

describe('cases that were once wrong', () => {
  beforeEach(async () => {
    scored ??= await scoreCorpus();
  });

  /** Each of these is a defect the benchmark found. They must stay fixed. */
  const regressions: Array<[string, boolean]> = [
    // Flagged its own safety advice as elevated_risk.
    ['en.b.otp_warning', false],
    // A genuine bank KYC notice scored 6 off a Tamil rule matching bare English.
    ['en.b.real_kyc_notice', false],
    // A real payment request with no deceptive framing.
    ['en.b.upi_bill', false],
    // "transfer your balance to the safe account" read as no transfer demand.
    ['en.s.safe_account', true],
    // Tamil script and Devanagari both scored zero before `indic.ts`.
    ['ta.s.otp', true],
    ['hi.s.upi', true],
    ['hi.l.s.job', true],
    // A capital I in "netfIix" defeated brand detection entirely.
    ['en.s.phishing_link', true],
    // The Tanglish PIN demand used an English verb with a Tamil imperative.
    ['ta.l.s.upi_pin', true],
  ];

  for (const [id, shouldFlag] of regressions) {
    it(`${id} is ${shouldFlag ? 'flagged' : 'not flagged'}`, () => {
      const row = scored.find((r) => r.id === id);
      expect(row, `${id} is missing from the corpus`).toBeDefined();
      expect(row!.flagged, `${id} came back ${row!.level} (score ${row!.score})`).toBe(shouldFlag);
    });
  }
});

describe('what the payment reader finds', () => {
  it('names the contradiction in the refund-collect case', async () => {
    const c = CORPUS.find((x) => x.id === 'en.s.refund_collect')!;
    const report = await analyze({ text: c.text, liveChecks: false, allowCloudAI: false });
    expect(report.paymentAction?.claimContradiction).toBe(true);
    expect(report.paymentAction?.direction).toBe('user_pays');
  });

  it('does not invent a contradiction for a genuine bill', async () => {
    const c = CORPUS.find((x) => x.id === 'en.b.upi_bill')!;
    const report = await analyze({ text: c.text, liveChecks: false, allowCloudAI: false });
    expect(report.paymentAction?.detected).toBe(true);
    expect(report.paymentAction?.claimContradiction).toBe(false);
  });
});

/** Exposed so the script and the test cannot drift apart. */
export function benchmarkLanguages(): Language[] {
  return LANGUAGES;
}
