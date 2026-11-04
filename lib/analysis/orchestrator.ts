import { randomUUID } from 'node:crypto';
import { buildChecklist } from './checklist';
import { CONTEXT_LABEL, contextRuleCount, detectContextSignals } from './context-rules';
import { detectSignals, ruleCount } from './detectors';
import { detectTanglishSignals, TANGLISH_RULE_COUNT } from './tanglish';
import { detectIndicSignals, INDIC_RULE_COUNT } from './indic';
import { buildCompleteness, buildPositives, buildQuestions } from './insights';
import { collectUrlEvidence, notCheckedEvidence } from './evidence';
import {
  detectPaymentAction,
  isImmediatePaymentPrompt,
  paymentActionLabel,
  paymentActionStep,
} from './payment-action';
import { runContextualAnalysis } from './llm';
import { buildPreview, classifyInput } from './normalize';
import {
  SEVERITY_WEIGHT,
  type Assessment,
  type EvidenceRecord,
  type Finding,
  type InputContext,
  type InputKind,
  type PaymentAction,
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
  /** What the user says they are looking at; unlocks context-specific rules. */
  context?: InputContext;
  /** When false, no URL is contacted over the network. */
  liveChecks?: boolean;
  /** Cloud model use is off by default and requires explicit user consent. */
  allowCloudAI?: boolean;
  /**
   * A QR payload the client already decoded on-device. The image itself never
   * needs to reach the server for the payment instruction to be read.
   */
  qrPayload?: string | null;
  isDemo?: boolean;
}

function buildAssessment(signals: Signal[], kind: InputKind, totalRules: number, context: InputContext): Assessment {
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

  const noun =
    context === 'job_offer' ? 'job offer'
    : context === 'invoice' ? 'invoice'
    : context === 'proposal' ? 'proposal'
    : kind === 'claim' ? 'claim'
    : kind === 'url' ? 'link'
    : 'message';
  const parts: string[] = [];
  if (signals.length === 0) {
    parts.push(
      `None of the ${totalRules} deterministic rules matched this ${noun}. That means the specific patterns we test for are absent — not that the ${noun} has been confirmed as legitimate.`,
    );
  } else {
    parts.push(
      `${signals.length} of ${totalRules} deterministic rules matched this ${noun}` +
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

/**
 * Payment facts, stated as deterministic findings.
 *
 * All of these come from parsing the instruction itself, so none of them is an
 * inference. The payee address is reported as the account that would be
 * credited and never as an identity, because anyone can create one.
 */
function paymentFindings(action: PaymentAction): Finding[] {
  if (!action.detected) return [];
  const out: Finding[] = [{ statement: paymentActionLabel(action), provenance: 'deterministic' }];

  if (action.direction === 'user_pays') {
    out.push({
      statement: 'The mechanism being described moves money out of your account, not into it.',
      provenance: 'deterministic',
    });
  }
  if (action.upi?.payeeVpa) {
    out.push({
      statement: `The payment address that would be credited is ${action.upi.payeeVpa}.` +
        (action.upi.payeeName ? ` The name attached to it, “${action.upi.payeeName}”, is set by whoever created the request and is not verified by any bank.` : ''),
      provenance: 'deterministic',
    });
  }
  if (action.upi?.amount) {
    out.push({
      statement: `The instruction fixes the amount at ${action.upi.currency ?? 'INR'} ${action.upi.amount}.`,
      provenance: 'deterministic',
    });
  }
  return out;
}

function buildUncertainty(
  kind: InputKind,
  totalRules: number,
  evidence: EvidenceRecord[],
  modelDegraded: boolean,
  modelReason: string | undefined,
  liveChecks: boolean,
  urlCount: number,
  extraUnknowns: string[],
  context: InputContext,
): Uncertainty {
  const checked: string[] = [`${totalRules} deterministic warning-sign rules were applied to the text.`];
  const notChecked: string[] = [];

  if (context !== 'generic') {
    checked.push(`Context-specific rules for "${CONTEXT_LABEL[context]}" were applied in addition to the general rules.`);
  }

  if (urlCount > 0) {
    checked.push(
      urlCount === 1
        ? '1 link had its structure parsed offline (domain, scheme, port, lookalike comparison).'
        : `${urlCount} links had their structure parsed offline (domain, scheme, port, lookalike comparison).`,
    );
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
  const liveChecks = options.liveChecks === true;
  const context: InputContext = options.context ?? 'generic';
  const kind: InputKind =
    !options.kind || options.kind === 'auto' ? classifyInput(text) : options.kind;
  const totalRules = ruleCount(kind) + contextRuleCount(context) + TANGLISH_RULE_COUNT + INDIC_RULE_COUNT;

  // 1. Deterministic text rules — generic first, then any that apply only to
  //    the context the user selected.
  const signals: Signal[] = detectSignals(text, kind);
  for (const contextSignal of detectContextSignals(text, context)) {
    if (!signals.some((s) => s.id === contextSignal.id)) signals.push(contextSignal);
  }

  //    Tamil written in Latin script, run unconditionally. Real messages mix
  //    languages freely — an English bank name with the demand in Tamil is the
  //    norm — so gating this on a detected language would miss most of them.
  for (const taSignal of detectTanglishSignals(text)) {
    if (!signals.some((s) => s.id === taSignal.id)) signals.push(taSignal);
  }

  //    Hindi, Devanagari and Tamil script. Also unconditional: a real message
  //    mixes scripts freely, and the benchmark measured 0% recall on native
  //    script before these existed.
  for (const indicSignal of detectIndicSignals(text)) {
    if (!signals.some((s) => s.id === indicSignal.id)) signals.push(indicSignal);
  }

  // 2. What is this asking the reader to do with money? This runs before the
  //    link work because the answer does not depend on it, and because a
  //    contradiction between the claim and the mechanism is the strongest
  //    deterministic finding the product can produce.
  const paymentAction = detectPaymentAction(text, options.qrPayload ?? null);
  if (paymentAction.claimContradiction && paymentAction.claimSpan) {
    // Only the contradiction earns a signal. A plain payment instruction with
    // no deceptive framing is information, not a warning sign, and inflating
    // it would train people to ignore the ones that matter.
    signals.push({
      id: 'payment.claim_contradiction',
      title: `${paymentActionLabel(paymentAction)}, while the message describes money coming to you`,
      category: 'payment',
      severity: 'critical',
      explanation: paymentAction.explanation,
      matches: [
        {
          text: paymentAction.claimSpan.text,
          start: paymentAction.claimSpan.start,
          end: paymentAction.claimSpan.end,
          note: 'The mechanism this message asks you to use takes money out. These are the words promising the opposite.',
        },
      ],
    });
  }

  // 3. Offline link structure. For a bare URL the input itself is the link.
  const urls = kind === 'url' ? [text.trim()] : extractUrls(text);
  for (const u of urls) {
    const { signals: urlSignals } = analyzeUrlStructure(u);
    for (const s of urlSignals) {
      if (!signals.some((existing) => existing.id === s.id)) signals.push(s);
    }
  }

  // 4. Live evidence, only for the primary link and only if enabled.
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

  // 5. Order the warning signs by severity for display.
  const severityRank = { critical: 0, high: 1, medium: 2, low: 3 } as const;
  signals.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  // 6. Contextual layer, given only what we established above.
  const contextual = await runContextualAnalysis(
    text,
    kind,
    signals,
    evidence,
    options.allowCloudAI === true,
  );

  const assessment = buildAssessment(signals, kind, totalRules, context);
  if (contextual.output?.summary) {
    assessment.summary = `${assessment.summary}\n\n${contextual.output.summary}`;
  }

  const findings = buildFindings(signals, evidence, contextual.output?.inferences ?? []);
  findings.push(...paymentFindings(paymentAction));

  const uncertainty = buildUncertainty(
    kind,
    totalRules,
    evidence,
    contextual.status.degraded,
    contextual.status.reason,
    liveChecks,
    urls.length,
    [...(contextual.output?.unknowns ?? []), ...paymentAction.unknowns],
    context,
  );

  const checklist = buildChecklist(signals, kind, context);
  /*
   * The refusal leads only when a payment prompt is already open. Otherwise it
   * sits directly under the context step, because for a scam still in progress
   * on a phone call, hanging up and ringing the bank back resolves the whole
   * situation — including the demand this step refuses.
   */
  const preventive = paymentActionStep(paymentAction);
  if (preventive && !checklist.some((c) => c.id === preventive.id)) {
    checklist.splice(isImmediatePaymentPrompt(paymentAction) ? 0 : 1, 0, preventive);
  }
  for (const extra of contextual.output?.suggestedChecks ?? []) {
    if (checklist.length >= 8) break;
    checklist.push({
      id: `chk.model.${checklist.length}`,
      action: extra.action,
      why: `${extra.why} (suggested by the contextual layer)`,
    });
  }

  const positives = buildPositives(signals, evidence, text);
  const questions = buildQuestions(signals, context);
  const completeness = buildCompleteness(signals, evidence, contextual.status, urls.length > 0);

  return {
    id: randomUUID(),
    inputKind: kind,
    inputContext: context,
    inputPreview: buildPreview(text),
    createdAt: new Date().toISOString(),
    assessment,
    signals,
    evidence,
    findings,
    uncertainty,
    checklist,
    positives,
    questions,
    completeness,
    paymentAction: paymentAction.detected ? paymentAction : null,
    model: contextual.status,
    isDemo,
    persisted: false,
  };
}
