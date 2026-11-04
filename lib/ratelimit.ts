/**
 * Request rate limiting, shared across instances where possible.
 *
 * The previous implementation was a Map in process memory. On a serverless
 * platform each instance holds its own, so the effective limit was the
 * configured limit times the number of warm instances, and it reset on every
 * cold start. That was release blocker B1.
 *
 * `consumeRateLimit` now spends quota against one Postgres counter via an
 * atomic INSERT .. ON CONFLICT DO UPDATE, so instances cannot race each other
 * past the limit.
 *
 * Two properties this module will not trade away:
 *
 *  - **It never fails open.** If the database is unreachable the in-process
 *    limiter still runs. Weaker protection, never none.
 *  - **It never claims more than it did.** Every result carries the `scope` it
 *    was actually enforced at, so a caller cannot report shared protection
 *    that silently degraded to per-instance.
 */

import { createHmac, createHash } from 'node:crypto';
import { getServiceClient, storeStatus } from './store';

export const DEFAULT_LIMIT = 12;
export const DEFAULT_WINDOW_SECONDS = 60;

const MAX_TRACKED_KEYS = 5_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  limit: number;
  /**
   * Where the count actually lives.
   * - `shared`   one counter for every instance
   * - `instance` this process only, because the shared store was unavailable
   */
  scope: 'shared' | 'instance';
}

export interface RateLimitOptions {
  limit?: number;
  windowSeconds?: number;
}

/* ------------------------------------------------------- in-process fallback */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * The per-instance limiter.
 *
 * Kept, rather than deleted, because it is the fallback when the shared store
 * is unreachable — and because a limiter that disappears under failure is how
 * an outage becomes an abuse window.
 */
export function checkRateLimit(
  key: string,
  now = Date.now(),
  options: RateLimitOptions = {},
): RateLimitResult {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const windowMs = (options.windowSeconds ?? DEFAULT_WINDOW_SECONDS) * 1_000;

  // Bound memory: a flood of distinct keys must not grow the map without end.
  if (buckets.size > MAX_TRACKED_KEYS) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
    if (buckets.size > MAX_TRACKED_KEYS) buckets.clear();
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0, limit, scope: 'instance' };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      limit,
      scope: 'instance',
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    retryAfterSeconds: 0,
    limit,
    scope: 'instance',
  };
}

/* ------------------------------------------------------------------- tokens */

/**
 * Turns a client key into the opaque token stored in the database.
 *
 * Raw client identifiers are never written. With `TRUSTLENS_HMAC_KEY` set this
 * is an HMAC, so even a reader of the table cannot test a guessed address
 * without the key.
 *
 * Without that variable it falls back to a plain SHA-256, and the limit of
 * that is worth stating rather than glossing: IPv4 is only 2^32 addresses, so
 * an attacker holding both the table and a list of candidates could confirm
 * which were recently rate-limited. The table is service-role only and rows
 * live for minutes, so the exposure is small — but configuring the key removes
 * it, and `rateLimitStatus()` reports which of the two is in force.
 */
function tokenFor(key: string): string {
  const secret = process.env.TRUSTLENS_HMAC_KEY?.trim();
  const digest = secret
    ? createHmac('sha256', secret).update(`ratelimit:${key}`).digest('base64url')
    : createHash('sha256').update(`ratelimit:${key}`).digest('base64url');
  return digest.slice(0, 32);
}

/* -------------------------------------------------------------- shared path */

interface ConsumeRow {
  allowed: boolean;
  remaining: number;
  retry_after_seconds: number;
}

/**
 * Whether the shared counter has been reachable.
 *
 * A missing migration surfaces as an undefined-function error on the first
 * call. Caching that means we fall back once rather than paying a failed round
 * trip on every request, and the shared path starts working the moment the
 * migration lands — with no deploy.
 */
let sharedCounter: 'unknown' | 'present' | 'absent' = 'unknown';

/** PostgREST reports an unknown function as 42883, a missing table as 42P01. */
function isMissingFunction(error: { code?: string; message?: string }): boolean {
  return (
    error.code === '42883' ||
    error.code === '42P01' ||
    error.code === 'PGRST202' ||
    /consume_rate_limit/i.test(error.message ?? '')
  );
}

/**
 * Spends one unit of quota against `key`.
 *
 * Prefer this over `checkRateLimit` in request handlers: it is the only path
 * that holds across instances.
 */
export async function consumeRateLimit(
  key: string,
  options: RateLimitOptions = {},
): Promise<RateLimitResult> {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const windowSeconds = options.windowSeconds ?? DEFAULT_WINDOW_SECONDS;

  if (sharedCounter === 'absent' || !storeStatus().enabled) {
    return checkRateLimit(key, Date.now(), { limit, windowSeconds });
  }

  const client = getServiceClient();
  if (!client) return checkRateLimit(key, Date.now(), { limit, windowSeconds });

  try {
    const { data, error } = await client.rpc('consume_rate_limit', {
      p_key: tokenFor(key),
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      if (isMissingFunction(error)) sharedCounter = 'absent';
      // Log a marker only. The key is a client identifier and never logged.
      console.error('[trustlens] shared rate limit unavailable:', error.code ?? '', (error.message ?? '').slice(0, 120));
      return checkRateLimit(key, Date.now(), { limit, windowSeconds });
    }

    const row = Array.isArray(data) ? (data[0] as ConsumeRow | undefined) : (data as ConsumeRow | null);
    if (!row || typeof row.allowed !== 'boolean') {
      return checkRateLimit(key, Date.now(), { limit, windowSeconds });
    }

    sharedCounter = 'present';
    return {
      allowed: row.allowed,
      remaining: Math.max(0, row.remaining ?? 0),
      retryAfterSeconds: row.allowed ? 0 : Math.max(1, row.retry_after_seconds ?? windowSeconds),
      limit,
      scope: 'shared',
    };
  } catch (err) {
    console.error('[trustlens] shared rate limit threw:', err instanceof Error ? err.message.slice(0, 120) : 'unknown');
    return checkRateLimit(key, Date.now(), { limit, windowSeconds });
  }
}

/** What the limiter can honestly say about itself, for `/api/health`. */
export function rateLimitStatus(): {
  shared: boolean;
  keyedTokens: boolean;
  limit: number;
  windowSeconds: number;
  note: string;
} {
  const shared = sharedCounter !== 'absent' && storeStatus().enabled;
  const keyedTokens = Boolean(process.env.TRUSTLENS_HMAC_KEY?.trim());
  return {
    shared,
    keyedTokens,
    limit: DEFAULT_LIMIT,
    windowSeconds: DEFAULT_WINDOW_SECONDS,
    note: shared
      ? keyedTokens
        ? 'One counter is shared across instances, keyed by HMAC.'
        : 'One counter is shared across instances. TRUSTLENS_HMAC_KEY is not set, so stored tokens are an unkeyed hash.'
      : 'Counting is per-instance because the shared store is unavailable, so the effective limit is higher than the configured one.',
  };
}

/** Derives a client key from proxy headers, falling back to a shared bucket. */
export function clientKeyFromHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first || headers.get('x-real-ip') || 'unknown-client';
}

/** Test hook. Clears in-process state and forgets what the shared store said. */
export function __resetRateLimits(): void {
  buckets.clear();
  sharedCounter = 'unknown';
}
