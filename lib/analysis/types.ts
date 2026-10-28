/**
 * Shared vocabulary for the TrustLens analysis pipeline.
 *
 * The central design rule: every statement the product shows a user carries a
 * `provenance` that says how it was produced. A deterministic rule match, a
 * fact retrieved over the network, and a model inference are never flattened
 * into the same "result" shape, because the user's decision depends on knowing
 * which is which.
 */

export type InputKind = 'message' | 'url' | 'claim';

export type SignalSeverity = 'critical' | 'high' | 'medium' | 'low';

export type SignalCategory =
  | 'urgency'
  | 'threat'
  | 'impersonation'
  | 'payment'
  | 'credentials'
  | 'domain'
  | 'link'
  | 'secrecy'
  | 'lure'
  | 'channel'
  | 'claim-language';

/** The exact span of input text that caused a rule to fire. */
export interface SignalMatch {
  text: string;
  start: number;
  end: number;
  note?: string;
}

export interface Signal {
  /** Stable rule identifier, safe to use as a React key and in tests. */
  id: string;
  title: string;
  category: SignalCategory;
  severity: SignalSeverity;
  /** Why this pattern matters for a trust decision, in plain language. */
  explanation: string;
  matches: SignalMatch[];
}

/**
 * How a piece of evidence turned out.
 * - `observed`   we retrieved this and it is a direct observation
 * - `unresolved` we tried and could not determine it
 * - `failed`     the check itself errored
 * - `not_checked` we deliberately did not run this check
 */
export type EvidenceStatus = 'observed' | 'unresolved' | 'failed' | 'not_checked';

export interface EvidenceRecord {
  id: string;
  /** What was consulted, e.g. "DNS resolution" or "HTTP response". */
  source: string;
  /** How it was obtained, so the claim is auditable. */
  method: string;
  /** The retrieved fact itself. Never a model guess. */
  detail: string;
  url?: string;
  status: EvidenceStatus;
  retrievedAt?: string;
}

/**
 * Provenance of a single statement in the report.
 * This is the product's core honesty mechanism.
 */
export type Provenance = 'deterministic' | 'retrieved' | 'model_inference';

export interface Finding {
  statement: string;
  provenance: Provenance;
  /** Only meaningful for model inferences. */
  confidence?: 'high' | 'moderate' | 'low';
}

export type AssessmentLevel =
  | 'high_risk'
  | 'elevated_risk'
  | 'some_signals'
  | 'no_signals_detected';

export interface Assessment {
  level: AssessmentLevel;
  headline: string;
  summary: string;
  /**
   * Weighted sum of deterministic signal severities. This is an internal
   * ranking aid, NOT a calibrated probability, and the UI must not present it
   * as a percentage likelihood of fraud.
   */
  signalScore: number;
}

export interface ChecklistStep {
  id: string;
  action: string;
  why: string;
}

export interface Uncertainty {
  /** Checks that actually ran. */
  checked: string[];
  /** Checks that did not run, and why. */
  notChecked: string[];
  /** Standing limits of the method itself. */
  limits: string[];
}

export interface ModelStatus {
  used: boolean;
  provider: 'vercel-ai-gateway' | 'anthropic' | 'none';
  model?: string;
  /** True when the contextual layer is unavailable and we said so. */
  degraded: boolean;
  reason?: string;
}

export interface Report {
  id: string;
  inputKind: InputKind;
  /** Truncated, display-safe echo of what was analyzed. */
  inputPreview: string;
  createdAt: string;
  assessment: Assessment;
  signals: Signal[];
  evidence: EvidenceRecord[];
  findings: Finding[];
  uncertainty: Uncertainty;
  checklist: ChecklistStep[];
  model: ModelStatus;
  /** True for the built-in example cases shown to reviewers. */
  isDemo: boolean;
  /** True when the report could not be saved; the UI must not imply history. */
  persisted: boolean;
}

export const SEVERITY_WEIGHT: Record<SignalSeverity, number> = {
  critical: 10,
  high: 6,
  medium: 3,
  low: 1,
};
