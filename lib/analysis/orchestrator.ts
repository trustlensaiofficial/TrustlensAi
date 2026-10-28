import { randomUUID } from 'node:crypto';
import { buildChecklist } from './checklist';
import { detectSignals, ruleCount } from './detectors';
import { collectUrlEvidence, notCheckedEvidence } from './evidence';
import { runContextualAnalysis } from './llm';
import { buildPreview, classifyInput } from './normalize';
import {
  SEVERITY_WEIGHT,
  type Assessment,
  type EvidenceRecord,
  type Finding,
  type InputKind,
  type Report,
  type Signal,
  type Uncertainty,
} from './types';
import { analyzeUrlStructure, extractUrls } from './url';

/**
 * The analysis pipeline.
 *
 * Order matters: deterministic rules and live evidence run FIRST, and their
 * results are handed to the contextual layer as the only material it may
 * reason from. That ordering is what lets us promise the model never claims a
 * check it did not perform.
 */

export interface AnalyzeOptions {
  text: string;
  /** 'auto' lets the classifier decide; the UI shows and can override it. */
  kind?: InputKind | 'auto';
  /** When false, no outbound request is made at all. */
  liveChecks?: boolean;
  isDemo?: boolean;
}

function buildAssessment(signals: Signal[], kind: InputKind): Assessment {
  const signalScore = signals.reduce((sum, s) => sum + SEVERITY_WEIGHT[s.severity], 0);
  const critical = signals.filter((s) => s.severity === 'critical').length;
  const high = signals.filter((s) => s.severity === 'high').length;

  let level: Assessment['level'];
  let headline: string;
  if (signalScore >= 20 || critical >= 2) {
    level = 'high_risk';
    headline = 'Multiple strong warning signs — treat this as unsafe until you have verified it independently';
  } else if (signalScore >= 10 || critical >= 1) {
    level = 'elevated_risk';
    headline = 'Serious warning signs that should be resolved before you act';
  } else if (signalScore >= 3) {
    level = 'some_signals';
    headline = 'Some warning signs worth checking before you act';
  } else {
    level = 'no_signals_detected';
    headline = 'No warning signs matched — this is not a guarantee that the content is genuine';
  }

  const noun = kind === 'claim' ? 'claim' : kind === 'url' ? 'link' : 'message';
  const parts: string[] = [];
  if (signals.length === 0) {
    parts.push(
      `None of the ${ruleCount(kind)} deterministic rules matched this ${noun}. That means the specific patterns we test for are absent — not that the ${noun} has been confirmed as legitimate.`,
    );
  } else {
    parts.push(
      `${signals.length} of ${ruleCount(kind)} deterministic rules matched this ${noun}` +
        (critical > 0 ? `, including ${critical} rated critical` : high > 0 ? `, including ${high} rated high` : '') +
        '.',
    );
    parts.push('Each warning sign below shows the exact text that triggered it, so you can judge the reasoning yourself.');
  }

  return { level, headline, summary: parts.join(' '), signalScore };
}

function buildFindings(
  signals: Signal[],
  evidence: EvidenceRecord[],
  inferences: Array<{ statement: string; confidence: 'high' | 'moderate' | 'low' }>,
): Finding[] {
  const findings: Finding[] = [];

  for (const s of signals) {
    const example = s.matches[0]?.text;
    findings.push({
      statement: example
        ? `${s.title}. Triggered by the text “${example.length > 90 ? `${example.slice(0, 89)}…` : example}”.`
        : s.title,
      provenance: 'deterministic',
    });
  }

  for (const e of evidence) {
    if (e.status !== 'observed') continue;
    findings.push({ statement: e.detail, provenance: 'retrieved' });
  }

  for (const i of inferences) {
    findings.push({ statement: i.statement, provenance: 'model_inference', confidence: i.confidence });
  }

  return findings;
}

function buildUncertainty(
  kind: InputKind,
  evidence: EvidenceRecord[],
  modelDegraded: boolean,
  modelReason: string | undefined,
  liveChecks: boolean,
  urlCount: number,
  extraUnknowns: string[],
): Uncertainty {
  const checked: string[] = [`${ruleCount(kind)} deterministic warning-sign rules were applied to the text.`];
  const notChecked: string[] = [];

  if (urlCount > 0) {
    checked.push(`${urlCount} link${urlCount === 1 ? '' : 's'} had their structure parsed offline (domain, scheme, port, lookalike comparison).`);
  } else if (kind !== 'claim') {
    notChecked.push('No link was present in the input, so no domain or destination check applied.');
  }

  for (const e of evidence) {
    if (e.status === 'observed') {
      checked.push(`${e.source}: ${e.method}.`);
    } else if (e.status === 'not_checked') {
      notChecked.push(`${e.source} was not checked. ${e.detail}`);
    } else if (e.status === 'unresolved') {
      notChecked.push(`${e.source} could not be determined. ${e.detail}`);
    } else if (e.status === 'failed') {
      notChecked.push(`${e.source} failed. ${e.detail}`);
    }
  }

  if (!liveChecks) {
    notChecked.push('Live checking was switched off for this analysis, so nothing was contacted over the network.');
  }
  if (modelDegraded && modelReason) {
    notChecked.push(modelReason);
  }

  notChecked.push(
    'The sender\'s real identity was not established. We do not check phone-number reputation, email authentication records, or whether an account is impersonating someone.',
  );
  if (kind === 'claim') {
    notChecked.push('No academic database, fact-checking archive or news source was queried. Claim assessment here is based on how the claim is worded, not on its truth.');
  }
  notChecked.push(...extraUnknowns);

  const limits = [
    'Pattern rules detect known wording. A scam written in unfamiliar phrasing, another language, or an image rather than text can pass them.',
    'The absence of warning signs is weak evidence. It means our specific tests did not match, which is not the same as the content being verified.',
    'The registrable domain is derived from an approximate public-suffix list, so unusual country-code domains may be split incorrectly.',
    'Nothing here establishes intent. Warning signs describe patterns associated with fraud, not proof that any particular sender is fraudulent.',
  ];
  if (!modelDegraded) {
    limits.push('The contextual interpretation is produced by a language model and can be wrong. It is labelled as inference throughout and is not a source of fact.');
  }

  return {
    checked: Array.from(new Set(checked)),
    notChecked: Array.from(new Set(notChecked)),
    limits,
  };
}

export async function analyze(options: AnalyzeOptions): Promise<Report> {
  const { text, isDemo = false } = options;
  const liveChecks = options.liveChecks !== false;
  const kind: InputKind =
    !options.kind || options.kind === 'auto' ? classifyInput(text) : options.kind;

  // 1. Deterministic text rules.
  const signals: Signal[] = detectSignals(text, kind);

  // 2. Offline link structure. For a bare URL the input itself is the link.
  const urls = kind === 'url' ? [text.trim()] : extractUrls(text);
  for (const u of urls) {
    const { signals: urlSignals } = analyzeUrlStructure(u);
    for (const s of urlSignals) {
      if (!signals.some((existing) => existing.id === s.id)) signals.push(s);
    }
  }

  // 3. Live evidence, only for the primary link and only if enabled.
  let evidence: EvidenceRecord[] = [];
  const primaryUrl = urls[0];
  if (primaryUrl && liveChecks) {
    evidence = await collectUrlEvidence(primaryUrl);
  } else if (primaryUrl && !liveChecks) {
    evidence = [notCheckedEvidence('Live checking was disabled for this analysis, so the destination was never contacted.')];
  } else {
    evidence = [
      notCheckedEvidence(
        kind === 'claim'
          ? 'This input contains no link, and the product does not query external fact databases, so no source was retrieved.'
          : 'This input contains no link, so there was no destination to contact.',
      ),
    ];
  }

  // 4. Order the warning signs by severity for display.
  const severityRank = { critical: 0, high: 1, medium: 2, low: 3 } as const;
  signals.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  // 5. Contextual layer, given only what we established above.
  const contextual = await runContextualAnalysis(text, kind, signals, evidence);

  const assessment = buildAssessment(signals, kind);
  if (contextual.output?.summary) {
    assessment.summary = `${assessment.summary}\n\n${contextual.output.summary}`;
  }

  const findings = buildFindings(signals, evidence, contextual.output?.inferences ?? []);

  const uncertainty = buildUncertainty(
    kind,
    evidence,
    contextual.status.degraded,
    contextual.status.reason,
    liveChecks,
    urls.length,
    contextual.output?.unknowns ?? [],
  );

  const checklist = buildChecklist(signals, kind);
  for (const extra of contextual.output?.suggestedChecks ?? []) {
    if (checklist.length >= 8) break;
    checklist.push({
      id: `chk.model.${checklist.length}`,
      action: extra.action,
      why: `${extra.why} (suggested by the contextual layer)`,
    });
  }

  return {
    id: randomUUID(),
    inputKind: kind,
    inputPreview: buildPreview(text),
    createdAt: new Date().toISOString(),
    assessment,
    signals,
    evidence,
    findings,
    uncertainty,
    checklist,
    model: contextual.status,
    isDemo,
    persisted: false,
  };
}
