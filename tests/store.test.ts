import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { storeStatus } from '../lib/store';

const KEYS = [
  'SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SECRET_KEY',
] as const;

const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe('storeStatus', () => {
  it('is disabled with a clear reason when nothing is configured', () => {
    const status = storeStatus();
    expect(status.enabled).toBe(false);
    expect(status.reason).toMatch(/not saved/i);
  });

  it('reports a missing server key separately from a missing URL', () => {
    process.env.SUPABASE_URL = 'https://abcdefgh.supabase.co';
    expect(storeStatus().reason).toMatch(/server key is missing/i);

    delete process.env.SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    expect(storeStatus().reason).toMatch(/URL is missing/i);
  });

  it('rejects a URL that is not a valid https address', () => {
    // This is the exact failure mode present on one project: a base64 blob
    // pasted into SUPABASE_URL instead of the project URL.
    process.env.SUPABASE_URL = 'eyJ2IjoidjIiLCJjIjoiZXhhbXBsZSJ9';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    const status = storeStatus();
    expect(status.enabled).toBe(false);
    expect(status.reason).toMatch(/not a valid https address/i);
    expect(status.reason).toContain('SUPABASE_URL');
  });

  it('rejects a plain http URL', () => {
    process.env.SUPABASE_URL = 'http://abcdefgh.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    expect(storeStatus().enabled).toBe(false);
  });

  it('is enabled once a valid URL and a server key are both present', () => {
    process.env.SUPABASE_URL = 'https://abcdefgh.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    expect(storeStatus().enabled).toBe(true);
  });

  it('accepts the alternative variable names', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abcdefgh.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'test-secret-key';
    expect(storeStatus().enabled).toBe(true);
  });
});
