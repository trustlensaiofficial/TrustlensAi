/**
 * Rate limiting.
 *
 * The property worth protecting with tests is not the happy path — it is that
 * the limiter still refuses requests when the shared store is gone. A limiter
 * that fails open turns a database outage into an abuse window, so most of
 * what follows exercises the degraded path deliberately.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  __resetRateLimits,
  checkRateLimit,
  clientKeyFromHeaders,
  consumeRateLimit,
  DEFAULT_LIMIT,
  rateLimitStatus,
} from '../lib/ratelimit';

const SUPABASE_VARS = [
  'SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SECRET_KEY',
];

let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  __resetRateLimits();
  saved = {};
  for (const v of [...SUPABASE_VARS, 'TRUSTLENS_HMAC_KEY']) {
    saved[v] = process.env[v];
    delete process.env[v];
  }
});

afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  __resetRateLimits();
});

describe('the in-process limiter', () => {
  it('allows exactly the configured number of requests', () => {
    for (let i = 0; i < DEFAULT_LIMIT; i += 1) {
      expect(checkRateLimit('a').allowed).toBe(true);
    }
    expect(checkRateLimit('a').allowed).toBe(false);
  });

  it('counts down the remaining allowance', () => {
    expect(checkRateLimit('b').remaining).toBe(DEFAULT_LIMIT - 1);
    expect(checkRateLimit('b').remaining).toBe(DEFAULT_LIMIT - 2);
  });

  it('gives a usable Retry-After rather than zero', () => {
    for (let i = 0; i < DEFAULT_LIMIT; i += 1) checkRateLimit('c');
    const denied = checkRateLimit('c');
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSeconds).toBeGreaterThan(0);
    expect(denied.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('rolls the window forward', () => {
    const start = 1_000_000;
    for (let i = 0; i < DEFAULT_LIMIT; i += 1) checkRateLimit('d', start);
    expect(checkRateLimit('d', start).allowed).toBe(false);
    // One window later the allowance is back.
    expect(checkRateLimit('d', start + 60_001).allowed).toBe(true);
  });

  it('keeps separate keys separate', () => {
    for (let i = 0; i < DEFAULT_LIMIT; i += 1) checkRateLimit('e');
    expect(checkRateLimit('e').allowed).toBe(false);
    expect(checkRateLimit('f').allowed).toBe(true);
  });

  it('honours a tighter per-call limit', () => {
    expect(checkRateLimit('g', Date.now(), { limit: 2 }).allowed).toBe(true);
    expect(checkRateLimit('g', Date.now(), { limit: 2 }).allowed).toBe(true);
    expect(checkRateLimit('g', Date.now(), { limit: 2 }).allowed).toBe(false);
  });

  it('does not grow without bound as distinct keys arrive', () => {
    // 6000 keys against a 5000-key ceiling. The point is that it survives and
    // keeps working, not the exact eviction policy.
    for (let i = 0; i < 6_000; i += 1) checkRateLimit(`flood-${i}`);
    expect(checkRateLimit('after-the-flood').allowed).toBe(true);
  });
});

describe('with no shared store configured', () => {
  it('still refuses requests instead of failing open', async () => {
    for (let i = 0; i < DEFAULT_LIMIT; i += 1) {
      expect((await consumeRateLimit('degraded')).allowed).toBe(true);
    }
    const denied = await consumeRateLimit('degraded');
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('says it is only counting per-instance, rather than claiming otherwise', async () => {
    const result = await consumeRateLimit('scope-check');
    expect(result.scope).toBe('instance');

    const status = rateLimitStatus();
    expect(status.shared).toBe(false);
    // The note has to be usable by a reader of /api/health, so it must name
    // the actual consequence.
    expect(status.note).toMatch(/per-instance/i);
    expect(status.note).toMatch(/effective limit is higher/i);
  });
});

describe('what gets stored', () => {
  it('reports unkeyed tokens honestly when no HMAC key is set', () => {
    expect(rateLimitStatus().keyedTokens).toBe(false);
    expect(rateLimitStatus().note).not.toMatch(/keyed by HMAC/);
  });

  it('reports keyed tokens once the key is present', () => {
    process.env.TRUSTLENS_HMAC_KEY = 'test-key-not-a-real-secret';
    expect(rateLimitStatus().keyedTokens).toBe(true);
  });
});

describe('client keys', () => {
  it('takes the first hop of x-forwarded-for', () => {
    const h = new Headers({ 'x-forwarded-for': '203.0.113.7, 70.41.3.18, 150.172.238.178' });
    expect(clientKeyFromHeaders(h)).toBe('203.0.113.7');
  });

  it('falls back to x-real-ip', () => {
    expect(clientKeyFromHeaders(new Headers({ 'x-real-ip': '198.51.100.4' }))).toBe('198.51.100.4');
  });

  it('shares one bucket when the client cannot be identified', () => {
    // Conservative on purpose: unidentifiable traffic is limited together
    // rather than exempted.
    expect(clientKeyFromHeaders(new Headers())).toBe('unknown-client');
  });
});
