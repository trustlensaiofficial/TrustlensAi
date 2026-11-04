/**
 * How a case moves, as a pure function.
 *
 * Kept separate from the database layer because this is where the decisions
 * are, and decisions should be testable without a Postgres instance. The store
 * reads and writes; this module says what the new state should be.
 *
 * The rule that matters: **a case never becomes less serious.** Status can
 * stall or advance, and `furthestAction` only ever moves toward more exposure.
 * Someone who transferred money and then tells us they also opened a link has
 * not improved their situation, and a case that quietly downgraded on the
 * milder later answer would hand them a milder plan.
 */

import { furthestAction, type UserActionState } from '../incident/recovery-plan';

/** The nine statuses from `docs/openapi.yaml`, which is authoritative. */
export type CaseStatus =
  | 'draft'
  | 'analysing'
  | 'findings_available'
  | 'needs_verification'
  | 'user_acted'
  | 'recovery_in_progress'
  | 'reported'
  | 'resolved'
  | 'closed';

export type CaseEventKind =
  | 'case_opened'
  | 'artifact_added'
  | 'analysis_run'
  | 'action_reported'
  | 'recovery_plan_generated'
  | 'report_exported'
  | 'status_changed'
  | 'note_added';

const STATUSES: CaseStatus[] = [
  'draft',
  'analysing',
  'findings_available',
  'needs_verification',
  'user_acted',
  'recovery_in_progress',
  'reported',
  'resolved',
  'closed',
];

const EVENT_KINDS: CaseEventKind[] = [
  'case_opened',
  'artifact_added',
  'analysis_run',
  'action_reported',
  'recovery_plan_generated',
  'report_exported',
  'status_changed',
  'note_added',
];

export function isCaseStatus(value: unknown): value is CaseStatus {
  return typeof value === 'string' && (STATUSES as string[]).includes(value);
}

export function isCaseEventKind(value: unknown): value is CaseEventKind {
  return typeof value === 'string' && (EVENT_KINDS as string[]).includes(value);
}

/**
 * How far through the lifecycle each status is.
 *
 * `resolved` and `closed` sit at the top because they are endings, not
 * severity. An automatic transition never reaches them — only the owner can
 * close a case, which is why `advance` refuses to move a closed case at all.
 */
const PROGRESS: Record<CaseStatus, number> = {
  draft: 0,
  analysing: 1,
  findings_available: 2,
  needs_verification: 3,
  user_acted: 4,
  recovery_in_progress: 5,
  reported: 6,
  resolved: 7,
  closed: 8,
};

/** Statuses the owner sets deliberately; never reached by an event. */
const TERMINAL: CaseStatus[] = ['resolved', 'closed'];

export function isTerminal(status: CaseStatus): boolean {
  return TERMINAL.includes(status);
}

/** What an event implies about the case's status, before clamping. */
const IMPLIED_BY_EVENT: Partial<Record<CaseEventKind, CaseStatus>> = {
  case_opened: 'draft',
  artifact_added: 'analysing',
  analysis_run: 'findings_available',
  action_reported: 'user_acted',
  recovery_plan_generated: 'recovery_in_progress',
  // Exporting a report is the step before filing one, and `reported` is the
  // honest description of where that leaves the case: we have not filed
  // anything, the person has what they need to.
  report_exported: 'reported',
};

export interface CaseState {
  status: CaseStatus;
  furthestAction: UserActionState | null;
}

export interface CaseEventInput {
  kind: CaseEventKind;
  actionState?: UserActionState | null;
}

/**
 * The case state after an event.
 *
 * Returns the same object shape it was given, so a caller can compare and skip
 * the write when nothing changed.
 */
export function advance(current: CaseState, event: CaseEventInput): CaseState {
  const action = furthestAction(current.furthestAction, event.actionState ?? null);

  /*
   * A closed or resolved case is left alone. Reopening is an explicit owner
   * action through PATCH, not something a late-arriving event does on its own —
   * otherwise exporting a report from an archive would silently revive it.
   */
  if (isTerminal(current.status)) {
    return { status: current.status, furthestAction: action };
  }

  const implied = IMPLIED_BY_EVENT[event.kind];
  if (!implied) return { status: current.status, furthestAction: action };

  // Never regress. An artifact added after an analysis does not return the
  // case to `analysing`, because the findings still exist.
  const status = PROGRESS[implied] > PROGRESS[current.status] ? implied : current.status;
  return { status, furthestAction: action };
}

/**
 * Whether the owner may set this status directly.
 *
 * Anything is permitted except `status_changed`-style bookkeeping values,
 * because the owner is allowed to disagree with us — including reopening a
 * case we marked resolved, or closing one we think is live.
 */
export function canSetStatus(next: unknown): next is CaseStatus {
  return isCaseStatus(next);
}

/** Highest severity across a case's signals, for the list view. */
export type HighestSeverity = 'critical' | 'high' | 'medium' | 'low' | 'none';

const SEVERITY_ORDER: HighestSeverity[] = ['critical', 'high', 'medium', 'low', 'none'];

export function highestSeverity(severities: readonly string[]): HighestSeverity {
  for (const level of SEVERITY_ORDER) {
    if (level !== 'none' && severities.includes(level)) return level;
  }
  return 'none';
}
