import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { safeNextPath, siteOrigin } from '../lib/auth/config';

/**
 * The post-sign-in redirect is the classic open-redirect surface: a login
 * link that bounces a freshly authenticated user onto an attacker's
 * lookalike. These assertions pin that shut.
 */
describe('safeNextPath', () => {
  it('allows ordinary same-origin paths', () => {
    expect(safeNextPath('/analyze')).toBe('/analyze');
    expect(safeNextPath('/report/abc-123')).toBe('/report/abc-123');
    expect(safeNextPath('/history?filter=high')).toBe('/history?filter=high');
  });

  it('rejects absolute URLs to other origins', () => {
    expect(safeNextPath('https://evil.example/phish')).toBe('/analyze');
    expect(safeNextPath('http://evil.example')).toBe('/analyze');
  });

  it('rejects protocol-relative URLs, which browsers treat as absolute', () => {
    expect(safeNextPath('//evil.example')).toBe('/analyze');
    expect(safeNextPath('/\\evil.example')).toBe('/analyze');
  });

  it('rejects embedded schemes', () => {
    expect(safeNextPath('/redirect?to=javascript://evil')).toBe('/analyze');
  });

  it('falls back when empty or missing', () => {
    expect(safeNextPath(null)).toBe('/analyze');
    expect(safeNextPath(undefined)).toBe('/analyze');
    expect(safeNextPath('')).toBe('/analyze');
    expect(safeNextPath('   ')).toBe('/analyze');
  });

  it('honours an explicit fallback', () => {
    expect(safeNextPath(null, '/account')).toBe('/account');
  });
});

describe('siteOrigin', () => {
  const saved: Record<string, string | undefined> = {};
  const KEYS = ['NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_VERCEL_URL', 'VERCEL_URL'] as const;

  beforeEach(() => { for (const k of KEYS) { saved[k] = process.env[k]; delete process.env[k]; } });
  afterEach(() => { for (const k of KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } });

  it('prefers the explicit site URL and strips trailing slashes', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://trustlensai-u2r6.vercel.app/';
    expect(siteOrigin()).toBe('https://trustlensai-u2r6.vercel.app');
  });

  it('falls back to the Vercel URL with https', () => {
    process.env.VERCEL_URL = 'some-deploy.vercel.app';
    expect(siteOrigin()).toBe('https://some-deploy.vercel.app');
  });

  it('falls back to localhost for development', () => {
    expect(siteOrigin()).toBe('http://localhost:3000');
  });

  it('never derives the origin from a request header', () => {
    // Guard against a regression that reads Host: an attacker-controlled
    // Host would let a callback be minted onto their domain.
    const source = String(siteOrigin);
    expect(source).not.toMatch(/headers\(\)|req\.|request\./);
  });
});
