/**
 * Consent receipts.
 *
 * Append-only, per capability, and versioned against the wording the person
 * actually saw. The table enforces the first of those with a trigger that
 * binds the service role too, so a mistake in this file cannot rewrite a
 * receipt — only add one.
 *
 * Why `policy_version` is not optional: without it, "you consented" is an
 * unfalsifiable claim. The disclosure text could be rewritten and the stored
 * row would still read as agreement to whatever it says today. With it, a
 * change of wording means consent has to be asked again, which is the only
 * reading that makes the record mean anything.
 *
 * A revocation is a new row with `granted: false`, never an edit. The history
 * is the point — "they turned this on in March and off in June" is a different
 * fact from "this is off", and only one of them survives an update.
 */

import { getServiceClient, storeStatus } from '../store';

/** The eight capability keys from `docs/openapi.yaml`. */
export const CONSENT_CAPABILITIES = [
  'deterministic_rules',
  'live_url_checks',
  'cloud_ai',
  'qr_parsing',
  'account_sync',
  'notification_monitoring',
  'call_screening',
  'sms_filtering',
] as const;

export type ConsentCapability = (typeof CONSENT_CAPABILITIES)[number];

export function isConsentCapability(value: unknown): value is ConsentCapability {
  return typeof value === 'string' && (CONSENT_CAPABILITIES as readonly string[]).includes(value);
}

export interface ConsentReceipt {
  id: string;
  capability: ConsentCapability;
  granted: boolean;
  policyVersion: string;
  createdAt: string;
}

/** The current answer for one capability, plus when it was last changed. */
export interface ConsentState {
  capability: ConsentCapability;
  granted: boolean;
  policyVersion: string | null;
  decidedAt: string | null;
  /**
   * True when the newest receipt was given against a different disclosure
   * version from the one in force. The client must ask again rather than
   * treating stale agreement as current.
   */
  stale: boolean;
}

export type ConsentResult<T> = { ok: true; value: T } | { ok: false; reason: string; status: number };

let tableState: 'unknown' | 'present' | 'absent' = 'unknown';

const NOT_MIGRATED =
  'Consent records are not available on this deployment yet: the consent table has not been created.';

function isMissingTable(error: { code?: string; message?: string }): boolean {
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /relation .*consent_receipts.* does not exist/i.test(error.message ?? '')
  );
}

function fail<T>(where: string, error: { code?: string; message?: string }): ConsentResult<T> {
  if (isMissingTable(error)) {
    tableState = 'absent';
    return { ok: false, reason: NOT_MIGRATED, status: 503 };
  }
  // A marker only: never the user id, never the capability set.
  console.error('[trustlens] consent', where, error.code ?? '', (error.message ?? '').slice(0, 160));
  return { ok: false, reason: 'The consent record could not be read or written.', status: 500 };
}

interface Row {
  id: string;
  capability: ConsentCapability;
  granted: boolean;
  policy_version: string;
  created_at: string;
}

/**
 * Records a decision.
 *
 * Always an insert. Granting something already granted is not an error — it is
 * a fresh receipt, which is exactly what re-consenting to new wording is.
 */
export async function recordConsent(
  userId: string,
  capability: ConsentCapability,
  granted: boolean,
  policyVersion: string,
): Promise<ConsentResult<ConsentReceipt>> {
  if (tableState === 'absent') return { ok: false, reason: NOT_MIGRATED, status: 503 };
  const status = storeStatus();
  if (!status.enabled) return { ok: false, reason: status.reason ?? 'Storage is not configured.', status: 503 };
  const client = getServiceClient();
  if (!client) return { ok: false, reason: 'The storage client could not be created.', status: 503 };

  const { data, error } = await client
    .from('consent_receipts')
    .insert({ user_id: userId, capability, granted, policy_version: policyVersion })
    .select('id, capability, granted, policy_version, created_at')
    .single();

  if (error) return fail('recordConsent', error);
  tableState = 'present';

  const row = data as Row;
  return {
    ok: true,
    value: {
      id: row.id,
      capability: row.capability,
      granted: row.granted,
      policyVersion: row.policy_version,
      createdAt: row.created_at,
    },
  };
}

/**
 * The current position for every capability.
 *
 * Absent means not granted, which is the default for everything that sends
 * data anywhere. A capability nobody has answered is reported as `granted:
 * false` with a null `decidedAt`, so a client can tell "declined" from "never
 * asked" — the two need different interfaces.
 */
export async function currentConsent(
  userId: string,
  policyVersion: string,
): Promise<ConsentResult<{ policyVersion: string; capabilities: ConsentState[] }>> {
  if (tableState === 'absent') return { ok: false, reason: NOT_MIGRATED, status: 503 };
  const status = storeStatus();
  if (!status.enabled) return { ok: false, reason: status.reason ?? 'Storage is not configured.', status: 503 };
  const client = getServiceClient();
  if (!client) return { ok: false, reason: 'The storage client could not be created.', status: 503 };

  const { data, error } = await client
    .from('consent_receipts')
    .select('id, capability, granted, policy_version, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return fail('currentConsent', error);
  tableState = 'present';

  // Newest row per capability wins. The query is already newest-first, so the
  // first sighting of a capability is its current answer.
  const newest = new Map<string, Row>();
  for (const row of (data ?? []) as Row[]) {
    if (!newest.has(row.capability)) newest.set(row.capability, row);
  }

  const capabilities: ConsentState[] = CONSENT_CAPABILITIES.map((capability) => {
    const row = newest.get(capability);
    if (!row) {
      return { capability, granted: false, policyVersion: null, decidedAt: null, stale: false };
    }
    return {
      capability,
      granted: row.granted,
      policyVersion: row.policy_version,
      decidedAt: row.created_at,
      // Agreement to older wording is not agreement to newer wording. Only a
      // grant can go stale; a refusal stands until the person changes it.
      stale: row.granted && row.policy_version !== policyVersion,
    };
  });

  return { ok: true, value: { policyVersion, capabilities } };
}

/** The full history for one user, newest first. For an export or an audit. */
export async function consentHistory(
  userId: string,
  limit = 200,
): Promise<ConsentResult<ConsentReceipt[]>> {
  if (tableState === 'absent') return { ok: false, reason: NOT_MIGRATED, status: 503 };
  const client = getServiceClient();
  if (!client) return { ok: false, reason: 'The storage client could not be created.', status: 503 };

  const { data, error } = await client
    .from('consent_receipts')
    .select('id, capability, granted, policy_version, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 500));

  if (error) return fail('consentHistory', error);

  return {
    ok: true,
    value: ((data ?? []) as Row[]).map((row) => ({
      id: row.id,
      capability: row.capability,
      granted: row.granted,
      policyVersion: row.policy_version,
      createdAt: row.created_at,
    })),
  };
}
