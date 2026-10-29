import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { storeStatus } from '../lib/store';

const KEYS = ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY'] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => { for (const k of KEYS) { saved[k] = process.env[k]; delete process.env[k]; } });
afterEach(() => { for (const k of KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } });

/**
 * A malformed SUPABASE_URL previously shadowed a perfectly good
 * NEXT_PUBLIC_SUPABASE_URL and silently disabled persistence on the
 * canonical deployment.
 */
describe('Supabase URL resolution falls through invalid values', () => {
  it('uses the public URL when the primary one is malformed', () => {
    process.env.SUPABASE_URL = 'eyJ2IjoidjIiLCJjIjoiYmxvYiJ9';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abcdefgh.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    expect(storeStatus().enabled).toBe(true);
  });

  it('still prefers the primary URL when it is valid', () => {
    process.env.SUPABASE_URL = 'https://primary.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://secondary.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    expect(storeStatus().enabled).toBe(true);
  });

  it('reports a malformed URL clearly when there is no valid fallback', () => {
    process.env.SUPABASE_URL = 'not-a-url';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    const status = storeStatus();
    expect(status.enabled).toBe(false);
    expect(status.reason).toMatch(/not a valid https address/i);
  });

  it('is disabled when nothing is configured', () => {
    expect(storeStatus().enabled).toBe(false);
  });
});
