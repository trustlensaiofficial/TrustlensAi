/**
 * Case persistence.
 *
 * Every function here takes the owner id as its first argument and filters on
 * it. RLS already scopes these tables, but this module holds the service-role
 * key, which bypasses RLS — so the owner filter *is* the access control here,
 * not a belt on top of one. A missing `.eq('user_id', …)` in this file would
 * be a cross-tenant read.
 *
 * Degradation: the case migration may not be applied. Postgres reports an
 * unknown table as 42P01, which is cached after the first attempt so an
 * unmigrated deployment costs one failed round trip rather than one per
 * request — and the feature starts working the moment the migration lands,
 * with no deploy.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getServiceClient, storeStatus } from '../store';
import { advance, highestSeverity, type CaseEventKind, type CaseStatus } from './transitions';
import type { UserActionState } from '../incident/recovery-plan';
import type { InputContext } from '../analysis/types';

export interface CaseSummary {
  id: string;
  title: string;
  status: CaseStatus;
  context: InputContext;
  createdAt: string;
  updatedAt: string;
  furthestAction: UserActionState | null;
  artifactCount: number;
  highestSeverity: ReturnType<typeof highestSeverity>;
}

export interface CaseArtifact {
  id: string;
  type: 'message' | 'url' | 'screenshot' | 'qr' | 'email' | 'sender_info' | 'note';
  text: string | null;
  url: string | null;
  storageObjectPath: string | null;
  senderLabel: string | null;
  provenance: string;
  freshness: 'live' | 'cached' | 'stale' | 'unknown';
  provider: string | null;
  retrievedAt: string | null;
  redacted: boolean;
  createdAt: string;
}

export interface CaseEvent {
  id: string;
  kind: CaseEventKind;
  actionState: UserActionState | null;
  detail: string | null;
  createdAt: string;
}

export interface CaseDetail extends CaseSummary {
  artifacts: CaseArtifact[];
  events: CaseEvent[];
}

/** Every operation reports why it could not proceed rather than throwing. */
export type CaseResult<T> = { ok: true; value: T } | { ok: false; reason: string; status: number };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let tables: 'unknown' | 'present' | 'absent' = 'unknown';

/** Postgres reports an unknown table as 42P01; PostgREST as PGRST205. */
function isMissingTable(error: { code?: string; message?: string }): boolean {
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /relation .*(cases|case_artifacts|case_events).* does not exist/i.test(error.message ?? '')
  );
}

const NOT_MIGRATED =
  'Case storage is not available on this deployment yet: the case tables have not been created. Analyses and recovery plans are unaffected.';

function unavailable<T>(reason: string, status = 503): CaseResult<T> {
  return { ok: false, reason, status };
}

function client(): CaseResult<SupabaseClient> {
  if (tables === 'absent') return unavailable(NOT_MIGRATED);
  const status = storeStatus();
  if (!status.enabled) return unavailable(status.reason ?? 'Storage is not configured.');
  const c = getServiceClient();
  if (!c) return unavailable('The storage client could not be created.');
  return { ok: true, value: c };
}

/**
 * Turns a Postgres error into a caller-safe result.
 *
 * Logs a short marker, never the row content and never the owner id.
 */
function fail<T>(where: string, error: { code?: string; message?: string }): CaseResult<T> {
  if (isMissingTable(error)) {
    tables = 'absent';
    return unavailable(NOT_MIGRATED);
  }
  console.error('[trustlens] case store', where, error.code ?? '', (error.message ?? '').slice(0, 160));
  return unavailable('The case could not be read or written.', 500);
}

interface CaseRow {
  id: string;
  title: string;
  status: CaseStatus;
  context: InputContext;
  created_at: string;
  updated_at: string;
  furthest_action: UserActionState | null;
}

function toSummary(row: CaseRow, artifactCount = 0): CaseSummary {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    context: row.context,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    furthestAction: row.furthest_action,
    artifactCount,
    // Severity comes from the analyses attached to a case, which are not
    // linked yet. Reported as `none` rather than guessed.
    highestSeverity: 'none',
  };
}

/* ------------------------------------------------------------------ create */

export async function createCase(
  userId: string,
  input: { title?: string; context?: InputContext },
): Promise<CaseResult<CaseSummary>> {
  const c = client();
  if (!c.ok) return c;

  const { data, error } = await c.value
    .from('cases')
    .insert({
      user_id: userId,
      title: input.title?.trim() || 'Untitled case',
      context: input.context ?? 'generic',
      status: 'draft',
    })
    .select('id, title, status, context, created_at, updated_at, furthest_action')
    .single();

  if (error) return fail('createCase', error);
  tables = 'present';

  // Open the timeline immediately, so an exported report can always show when
  // the case began rather than inferring it from the oldest artifact.
  await c.value.from('case_events').insert({ case_id: (data as CaseRow).id, kind: 'case_opened' });

  return { ok: true, value: toSummary(data as CaseRow) };
}

/* -------------------------------------------------------------------- list */

export async function listCases(
  userId: string,
  options: { limit?: number; cursor?: string } = {},
): Promise<CaseResult<{ cases: CaseSummary[]; nextCursor: string | null }>> {
  const c = client();
  if (!c.ok) return c;

  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);

  let query = c.value
    .from('cases')
    .select('id, title, status, context, created_at, updated_at, furthest_action')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit + 1);

  /*
   * Cursor pagination on updated_at, not offset. An offset page silently skips
   * or repeats rows when a case is touched between requests, which for a list
   * someone is working through is worse than slower paging.
   */
  if (options.cursor) {
    if (Number.isNaN(Date.parse(options.cursor))) {
      return { ok: false, reason: 'That cursor is not valid.', status: 400 };
    }
    query = query.lt('updated_at', options.cursor);
  }

  const { data, error } = await query;
  if (error) return fail('listCases', error);
  tables = 'present';

  const rows = (data ?? []) as CaseRow[];
  const page = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? (page[page.length - 1]?.updated_at ?? null) : null;

  return { ok: true, value: { cases: page.map((r) => toSummary(r)), nextCursor } };
}

/* --------------------------------------------------------------------- get */

export async function getCase(userId: string, caseId: string): Promise<CaseResult<CaseDetail>> {
  if (!UUID.test(caseId)) return { ok: false, reason: 'No case exists with that id.', status: 404 };
  const c = client();
  if (!c.ok) return c;

  const { data, error } = await c.value
    .from('cases')
    .select('id, title, status, context, created_at, updated_at, furthest_action')
    .eq('id', caseId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return fail('getCase', error);
  tables = 'present';

  /*
   * A case belonging to someone else is reported exactly as one that does not
   * exist. Distinguishing them would confirm the id is real, which is itself
   * the leak.
   */
  if (!data) return { ok: false, reason: 'No case exists with that id.', status: 404 };
  const row = data as CaseRow;

  const [artifacts, events] = await Promise.all([
    c.value
      .from('case_artifacts')
      .select('id, type, text, url, storage_object_path, sender_label, provenance, freshness, provider, retrieved_at, redacted, created_at')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true }),
    c.value
      .from('case_events')
      .select('id, kind, action_state, detail, created_at')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true }),
  ]);

  if (artifacts.error) return fail('getCase.artifacts', artifacts.error);
  if (events.error) return fail('getCase.events', events.error);

  type ArtifactRow = {
    id: string; type: CaseArtifact['type']; text: string | null; url: string | null;
    storage_object_path: string | null; sender_label: string | null; provenance: string;
    freshness: CaseArtifact['freshness']; provider: string | null; retrieved_at: string | null;
    redacted: boolean; created_at: string;
  };
  type EventRow = {
    id: string; kind: CaseEventKind; action_state: UserActionState | null;
    detail: string | null; created_at: string;
  };

  const artifactRows = (artifacts.data ?? []) as ArtifactRow[];

  return {
    ok: true,
    value: {
      ...toSummary(row, artifactRows.length),
      artifacts: artifactRows.map((a) => ({
        id: a.id,
        type: a.type,
        text: a.text,
        url: a.url,
        storageObjectPath: a.storage_object_path,
        senderLabel: a.sender_label,
        provenance: a.provenance,
        freshness: a.freshness,
        provider: a.provider,
        retrievedAt: a.retrieved_at,
        redacted: a.redacted,
        createdAt: a.created_at,
      })),
      events: ((events.data ?? []) as EventRow[]).map((e) => ({
        id: e.id,
        kind: e.kind,
        actionState: e.action_state,
        detail: e.detail,
        createdAt: e.created_at,
      })),
    },
  };
}

/* ------------------------------------------------------------------ update */

export async function updateCase(
  userId: string,
  caseId: string,
  patch: { title?: string; status?: CaseStatus },
): Promise<CaseResult<CaseSummary>> {
  if (!UUID.test(caseId)) return { ok: false, reason: 'No case exists with that id.', status: 404 };
  const c = client();
  if (!c.ok) return c;

  const changes: Record<string, unknown> = {};
  if (patch.title !== undefined) changes.title = patch.title.trim() || 'Untitled case';
  if (patch.status !== undefined) changes.status = patch.status;
  if (Object.keys(changes).length === 0) {
    return { ok: false, reason: 'Nothing to change.', status: 400 };
  }

  const { data, error } = await c.value
    .from('cases')
    .update(changes)
    .eq('id', caseId)
    .eq('user_id', userId)
    .select('id, title, status, context, created_at, updated_at, furthest_action')
    .maybeSingle();

  if (error) return fail('updateCase', error);
  tables = 'present';
  if (!data) return { ok: false, reason: 'No case exists with that id.', status: 404 };

  if (patch.status !== undefined) {
    await c.value.from('case_events').insert({
      case_id: caseId,
      kind: 'status_changed',
      detail: `Status set to ${patch.status} by the owner.`,
    });
  }

  return { ok: true, value: toSummary(data as CaseRow) };
}

/* ------------------------------------------------------------------ delete */

export async function deleteCase(userId: string, caseId: string): Promise<CaseResult<true>> {
  if (!UUID.test(caseId)) return { ok: false, reason: 'No case exists with that id.', status: 404 };
  const c = client();
  if (!c.ok) return c;

  // Artifacts and events cascade. A person's right to delete their own data
  // outranks the append-only timeline of a case that no longer exists.
  const { data, error } = await c.value
    .from('cases')
    .delete()
    .eq('id', caseId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();

  if (error) return fail('deleteCase', error);
  tables = 'present';
  if (!data) return { ok: false, reason: 'No case exists with that id.', status: 404 };
  return { ok: true, value: true };
}

/* --------------------------------------------------------------- artifacts */

export interface ArtifactInput {
  type: CaseArtifact['type'];
  text?: string;
  url?: string;
  storageObjectPath?: string;
  senderLabel?: string;
}

export async function addArtifact(
  userId: string,
  caseId: string,
  input: ArtifactInput,
): Promise<CaseResult<CaseArtifact>> {
  // Ownership is established before any write, because the artifact table's
  // own insert has no user_id to filter on.
  const owned = await getCase(userId, caseId);
  if (!owned.ok) return owned;

  const c = client();
  if (!c.ok) return c;

  const { data, error } = await c.value
    .from('case_artifacts')
    .insert({
      case_id: caseId,
      type: input.type,
      text: input.text ?? null,
      url: input.url ?? null,
      storage_object_path: input.storageObjectPath ?? null,
      sender_label: input.senderLabel ?? null,
      // Everything a person attaches is user_supplied. A display name is not
      // identity, and a pasted message is not a retrieved fact.
      provenance: 'user_supplied',
      freshness: 'unknown',
    })
    .select('id, type, text, url, storage_object_path, sender_label, provenance, freshness, provider, retrieved_at, redacted, created_at')
    .single();

  if (error) return fail('addArtifact', error);

  await recordEvent(userId, caseId, { kind: 'artifact_added', detail: `Added a ${input.type}.` });

  const a = data as {
    id: string; type: CaseArtifact['type']; text: string | null; url: string | null;
    storage_object_path: string | null; sender_label: string | null; provenance: string;
    freshness: CaseArtifact['freshness']; provider: string | null; retrieved_at: string | null;
    redacted: boolean; created_at: string;
  };

  return {
    ok: true,
    value: {
      id: a.id,
      type: a.type,
      text: a.text,
      url: a.url,
      storageObjectPath: a.storage_object_path,
      senderLabel: a.sender_label,
      provenance: a.provenance,
      freshness: a.freshness,
      provider: a.provider,
      retrievedAt: a.retrieved_at,
      redacted: a.redacted,
      createdAt: a.created_at,
    },
  };
}

/* ------------------------------------------------------------------ events */

export interface EventInput {
  kind: CaseEventKind;
  actionState?: UserActionState | null;
  detail?: string;
}

/**
 * Appends an event and moves the case to match.
 *
 * The status and `furthest_action` are decided by `advance`, which never lets
 * either go backwards — see `lib/cases/transitions.ts`.
 */
export async function recordEvent(
  userId: string,
  caseId: string,
  input: EventInput,
): Promise<CaseResult<{ event: CaseEvent; case: CaseSummary }>> {
  const owned = await getCase(userId, caseId);
  if (!owned.ok) return owned;

  const c = client();
  if (!c.ok) return c;

  const { data, error } = await c.value
    .from('case_events')
    .insert({
      case_id: caseId,
      kind: input.kind,
      action_state: input.actionState ?? null,
      detail: input.detail ?? null,
    })
    .select('id, kind, action_state, detail, created_at')
    .single();

  if (error) return fail('recordEvent', error);

  const next = advance(
    { status: owned.value.status, furthestAction: owned.value.furthestAction },
    { kind: input.kind, actionState: input.actionState ?? null },
  );

  let summary = owned.value as CaseSummary;
  const changed =
    next.status !== owned.value.status || next.furthestAction !== owned.value.furthestAction;

  if (changed) {
    const updated = await c.value
      .from('cases')
      .update({ status: next.status, furthest_action: next.furthestAction })
      .eq('id', caseId)
      .eq('user_id', userId)
      .select('id, title, status, context, created_at, updated_at, furthest_action')
      .maybeSingle();

    if (updated.error) return fail('recordEvent.advance', updated.error);
    if (updated.data) summary = toSummary(updated.data as CaseRow, owned.value.artifactCount);
  }

  const e = data as {
    id: string; kind: CaseEventKind; action_state: UserActionState | null;
    detail: string | null; created_at: string;
  };

  return {
    ok: true,
    value: {
      event: {
        id: e.id,
        kind: e.kind,
        actionState: e.action_state,
        detail: e.detail,
        createdAt: e.created_at,
      },
      case: summary,
    },
  };
}

/** Whether case storage is usable, for `/api/health` and `/capabilities`. */
export function caseStoreStatus(): { available: boolean; reason?: string } {
  if (tables === 'absent') return { available: false, reason: NOT_MIGRATED };
  const s = storeStatus();
  if (!s.enabled) return { available: false, reason: s.reason };
  return { available: true };
}
