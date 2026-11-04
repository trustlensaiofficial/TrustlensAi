/**
 * Measures the detection engine against the labelled corpus.
 *
 * `docs/PRODUCT_CHARTER.md` §6 item 7 forbids publishing any accuracy figure
 * until measured precision and recall exist. This produces them.
 *
 * Threshold, stated because the number is meaningless without it: a case
 * counts as FLAGGED when the assessment level is `high_risk` or
 * `elevated_risk`. `some_signals` counts as NOT flagged — it is the engine
 * saying "worth a look", which is not the same as a warning, and counting it
 * as a detection would inflate recall by moving the goalposts.
 *
 * Deterministic rules only: live checks and cloud AI are off, so the figure
 * describes what the engine does with no network and no model.
 */
import { analyze } from '../lib/analysis/orchestrator.ts';
import { CORPUS, LANGUAGES } from '../tests/fixtures/corpus.ts';

delete process.env.AI_GATEWAY_API_KEY;
delete process.env.ANTHROPIC_API_KEY;

const FLAGGED = new Set(['high_risk', 'elevated_risk']);

const results = [];
for (const c of CORPUS) {
  const report = await analyze({
    text: c.text,
    context: c.context ?? 'generic',
    liveChecks: false,
    allowCloudAI: false,
  });
  const flagged = FLAGGED.has(report.assessment.level);
  results.push({ ...c, flagged, level: report.assessment.level, score: report.assessment.signalScore });
}

function metrics(rows) {
  const tp = rows.filter((r) => r.scam && r.flagged).length;
  const fp = rows.filter((r) => !r.scam && r.flagged).length;
  const fn = rows.filter((r) => r.scam && !r.flagged).length;
  const tn = rows.filter((r) => !r.scam && !r.flagged).length;
  const precision = tp + fp === 0 ? null : tp / (tp + fp);
  const recall = tp + fn === 0 ? null : tp / (tp + fn);
  const f1 = precision && recall && precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : null;
  return { tp, fp, fn, tn, precision, recall, f1, n: rows.length };
}

const pct = (v) => (v === null ? '   — ' : `${(v * 100).toFixed(1)}%`);

const overall = metrics(results);
console.log('\n=== OVERALL (deterministic rules only) ===');
console.log(`  cases ${overall.n}   TP ${overall.tp}  FP ${overall.fp}  FN ${overall.fn}  TN ${overall.tn}`);
console.log(`  precision ${pct(overall.precision)}   recall ${pct(overall.recall)}   F1 ${pct(overall.f1)}`);

console.log('\n=== BY LANGUAGE ===');
console.log('  lang       n   TP  FP  FN  TN   precision   recall');
for (const lang of LANGUAGES) {
  const m = metrics(results.filter((r) => r.language === lang));
  console.log(
    `  ${lang.padEnd(9)} ${String(m.n).padStart(2)}  ${String(m.tp).padStart(3)} ${String(m.fp).padStart(3)} ${String(m.fn).padStart(3)} ${String(m.tn).padStart(3)}   ${pct(m.precision).padStart(8)}  ${pct(m.recall).padStart(7)}`,
  );
}

console.log('\n=== MISSED SCAMS (false negatives) ===');
const misses = results.filter((r) => r.scam && !r.flagged);
if (misses.length === 0) console.log('  none');
for (const r of misses) {
  console.log(`  ${r.id.padEnd(18)} ${r.level.padEnd(20)} score=${String(r.score).padStart(2)}  ${r.text.slice(0, 70)}`);
}

console.log('\n=== FALSE ALARMS (benign flagged) ===');
const alarms = results.filter((r) => !r.scam && r.flagged);
if (alarms.length === 0) console.log('  none');
for (const r of alarms) {
  console.log(`  ${r.id.padEnd(18)} ${r.level.padEnd(20)} score=${String(r.score).padStart(2)}  ${r.text.slice(0, 70)}`);
}
console.log('');
