/**
 * Best-effort in-process rate limiting.
 *
 * Stated plainly because it matters: on a serverless platform this counter
 * lives in one function instance, so a burst spread across instances can
 * exceed the nominal limit. It is real protection against a single client
 * hammering one warm instance, and it is NOT a substitute for a shared store
 * (Upstash, Vercel KV) in production. Documented in AGENTS.md as known work.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;
const MAX_TRACKED_KEYS = 5_000;

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  limit: number;
}

export function checkRateLimit(key: string, now = Date.now()): RateLimitResult {
  // Bound memory: a flood of distinct keys must not grow the map without end.
  if (buckets.size > MAX_TRACKED_KEYS) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
    if (buckets.size > MAX_TRACKED_KEYS) buckets.clear();
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1, retryAfterSeconds: 0, limit: MAX_REQUESTS };
  }

  if (existing.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      limit: MAX_REQUESTS,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: MAX_REQUESTS - existing.count,
    retryAfterSeconds: 0,
    limit: MAX_REQUESTS,
  };
}

/** Derives a client key from proxy headers, falling back to a shared bucket. */
export function clientKeyFromHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first || headers.get('x-real-ip') || 'unknown-client';
}

/** Test hook. */
export function __resetRateLimits(): void {
  buckets.clear();
}
