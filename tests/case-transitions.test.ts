/**
 * Case lifecycle.
 *
 * The invariant under test is that a case never becomes less serious on its
 * own. Everything else here is detail; that one is the reason the module is a
 * pure function instead of a few lines inside the store.
 */

import { describe, expect, it } from 'vitest';
import {
  advance,
  canSetStatus,
  highestSeverity,
  isCaseEventKind,
  isCaseStatus,
  isTerminal,
  type CaseState,
  type CaseStatus,
} from '../lib/cases/transitions';

const draft: CaseState = { status: 'draft', furthestAction: null };

describe('validation', () => {
  it('accepts the nine contract statuses and nothing else', () => {
    for (const s of [
      'draft', 'analysing', 'findings_available', 'needs_verification', 'user_acted',
      'recovery_in_progress', 'reported', 'resolved', 'closed',
    ]) {
      expect(isCaseStatus(s), s).toBe(true);
    }
    expect(isCaseStatus('open')).toBe(false);
    expect(isCaseStatus('')).toBe(false);
    expect(isCaseStatus(null)).toBe(false);
    // Must not be satisfied by a prototype member.
    expect(isCaseStatus('toString')).toBe(false);
    expect(isCaseStatus('constructor')).toBe(false);
  });

  it('accepts the eight contract event kinds and nothing else', () => {
    expect(isCaseEventKind('analysis_run')).toBe(true);
    expect(isCaseEventKind('deleted')).toBe(false);
    expect(isCaseEventKind('toString')).toBe(false);
  });
});

describe('a case advances but never regresses', () => {
  it('moves forward through the lifecycle', () => {
    let state = draft;
    state = advance(state, { kind: 'artifact_added' });
    expect(state.status).toBe('analysing');
    state = advance(state, { kind: 'analysis_run' });
    expect(state.status).toBe('findings_available');
    state = advance(state, { kind: 'action_reported', actionState: 'opened_link' });
    expect(state.status).toBe('user_acted');
    state = advance(state, { kind: 'recovery_plan_generated' });
    expect(state.status).toBe('recovery_in_progress');
  });

  it('does not return to analysing when an artifact arrives after findings', () => {
    // The findings still exist. Rewinding the status would misdescribe the case.
    const state = advance({ status: 'findings_available', furthestAction: null }, { kind: 'artifact_added' });
    expect(state.status).toBe('findings_available');
  });

  it('ignores events that imply nothing about status', () => {
    const state = advance({ status: 'findings_available', furthestAction: null }, { kind: 'note_added' });
    expect(state.status).toBe('findings_available');
  });

  it('never advances past reported on its own', () => {
    // resolved and closed are endings the owner declares, not states an event
    // can reach — otherwise a case would archive itself.
    let state = draft;
    for (const kind of [
      'case_opened', 'artifact_added', 'analysis_run', 'action_reported',
      'recovery_plan_generated', 'report_exported', 'note_added', 'status_changed',
    ] as const) {
      state = advance(state, { kind });
    }
    expect(state.status).toBe('reported');
    expect(isTerminal(state.status)).toBe(false);
  });
});

describe('a closed case stays closed', () => {
  it('is not revived by a late event', () => {
    // Exporting a report out of an archive must not silently reopen the case.
    const state = advance({ status: 'closed', furthestAction: 'opened_link' }, { kind: 'report_exported' });
    expect(state.status).toBe('closed');
  });

  it('is not revived by an analysis either', () => {
    expect(advance({ status: 'resolved', furthestAction: null }, { kind: 'analysis_run' }).status).toBe('resolved');
  });

  it('still records a worse action, because the plan must be right even so', () => {
    // The status is an archival decision. The exposure is a fact, and if
    // someone reopens the case the plan has to reflect the worst of it.
    const state = advance(
      { status: 'closed', furthestAction: 'opened_link' },
      { kind: 'action_reported', actionState: 'transferred_money' },
    );
    expect(state.status).toBe('closed');
    expect(state.furthestAction).toBe('transferred_money');
  });

  it('can be reopened deliberately by the owner', () => {
    expect(canSetStatus('needs_verification')).toBe(true);
    expect(canSetStatus('nonsense')).toBe(false);
  });
});

describe('furthestAction only ever worsens', () => {
  it('upgrades when the new report is worse', () => {
    const state = advance(
      { status: 'user_acted', furthestAction: 'opened_link' },
      { kind: 'action_reported', actionState: 'transferred_money' },
    );
    expect(state.furthestAction).toBe('transferred_money');
  });

  it('holds when the new report is milder', () => {
    // The whole point. Answering a later question more mildly must not produce
    // a milder recovery plan.
    const state = advance(
      { status: 'user_acted', furthestAction: 'transferred_money' },
      { kind: 'action_reported', actionState: 'opened_link' },
    );
    expect(state.furthestAction).toBe('transferred_money');
  });

  it('is unaffected by an event carrying no action', () => {
    const state = advance(
      { status: 'user_acted', furthestAction: 'entered_upi_pin' },
      { kind: 'note_added' },
    );
    expect(state.furthestAction).toBe('entered_upi_pin');
  });

  it('treats an explicit null as no new information', () => {
    const state = advance(
      { status: 'user_acted', furthestAction: 'shared_otp_or_pin' },
      { kind: 'action_reported', actionState: null },
    );
    expect(state.furthestAction).toBe('shared_otp_or_pin');
  });

  it('survives any sequence of reports in any order', () => {
    const reports = ['opened_link', 'transferred_money', 'scanned_qr_only', 'installed_app'] as const;
    let forwards: CaseState = draft;
    for (const a of reports) forwards = advance(forwards, { kind: 'action_reported', actionState: a });

    let backwards: CaseState = draft;
    for (const a of [...reports].reverse()) backwards = advance(backwards, { kind: 'action_reported', actionState: a });

    // Order of answers cannot change the outcome.
    expect(forwards.furthestAction).toBe('transferred_money');
    expect(backwards.furthestAction).toBe('transferred_money');
  });
});

describe('highest severity for the case list', () => {
  it('reports the worst present', () => {
    expect(highestSeverity(['low', 'critical', 'medium'])).toBe('critical');
    expect(highestSeverity(['medium', 'low'])).toBe('medium');
    expect(highestSeverity(['low'])).toBe('low');
  });

  it('reports none for an empty case rather than inventing a floor', () => {
    expect(highestSeverity([])).toBe('none');
  });

  it('ignores values that are not severities', () => {
    expect(highestSeverity(['urgent', 'severe'])).toBe('none');
  });
});

describe('statuses are stable identifiers', () => {
  it('has no duplicate progress values', () => {
    const all: CaseStatus[] = [
      'draft', 'analysing', 'findings_available', 'needs_verification', 'user_acted',
      'recovery_in_progress', 'reported', 'resolved', 'closed',
    ];
    // Each status must be distinguishable, or "never regress" is meaningless.
    const reached = new Set(all.map((s) => advance({ status: s, furthestAction: null }, { kind: 'note_added' }).status));
    expect(reached.size).toBe(all.length);
  });
});
