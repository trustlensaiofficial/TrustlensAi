import { describe, expect, it } from 'vitest';
import {
  analyzeUrlStructure,
  extractUrls,
  getRegistrableDomain,
  levenshtein,
  parseUrl,
} from '../lib/analysis/url';

const ids = (u: string) => analyzeUrlStructure(u).signals.map((s) => s.id);

describe('registrable domain', () => {
  it('handles plain two-label domains', () => {
    expect(getRegistrableDomain('example.com')).toBe('example.com');
    expect(getRegistrableDomain('www.example.com')).toBe('example.com');
  });

  it('handles multi-part public suffixes', () => {
    expect(getRegistrableDomain('login.hdfcbank.co.in')).toBe('hdfcbank.co.in');
    expect(getRegistrableDomain('a.b.service.co.uk')).toBe('service.co.uk');
  });
});

describe('levenshtein', () => {
  it('measures single edits', () => {
    expect(levenshtein('paypal', 'paypal')).toBe(0);
    expect(levenshtein('paypa1', 'paypal')).toBe(1);
    expect(levenshtein('micrsoft', 'microsoft')).toBe(1);
  });
});

describe('url structure analysis', () => {
  it('catches a brand name hidden in a subdomain', () => {
    const signals = ids('https://paypal.com.secure-login.verify-id.xyz/login');
    expect(signals).toContain('url.brand_mismatch.paypal');
  });

  it('catches a near-miss brand spelling', () => {
    expect(ids('https://paypa1.com/login')).toContain('url.lookalike.paypal');
  });

  it('does not flag the genuine brand domain', () => {
    const signals = ids('https://www.paypal.com/signin');
    expect(signals.some((s) => s.startsWith('url.brand_mismatch'))).toBe(false);
    expect(signals.some((s) => s.startsWith('url.lookalike'))).toBe(false);
  });

  it('does not flag a legitimate brand subdomain', () => {
    const signals = ids('https://account.microsoftonline.com/login');
    expect(signals.some((s) => s.startsWith('url.brand_mismatch'))).toBe(false);
  });

  it('flags credentials before the @ sign', () => {
    expect(ids('https://www.paypal.com@evil.example.net/')).toContain('url.embedded_credentials');
  });

  it('flags raw IP hosts and punycode', () => {
    expect(ids('http://203.0.113.9/account')).toContain('url.ip_literal');
    expect(ids('https://xn--pypal-4ve.com/')).toContain('url.punycode');
  });

  it('flags shorteners and high-abuse TLDs', () => {
    expect(ids('https://bit.ly/3xYz')).toContain('url.shortener');
    expect(ids('https://claim-reward.top/now')).toContain('url.high_abuse_tld');
  });

  it('flags plain http', () => {
    expect(ids('http://example.com/login')).toContain('url.no_tls');
    expect(ids('https://example.com/login')).not.toContain('url.no_tls');
  });

  it('rejects non-web schemes', () => {
    expect(parseUrl('file:///etc/passwd')).toBeNull();
    expect(parseUrl('javascript:alert(1)')).toBeNull();
    expect(parseUrl('not a url at all')).toBeNull();
  });

  it('assumes http for a bare host so pasted domains still parse', () => {
    expect(parseUrl('example.com')?.hostname).toBe('example.com');
  });
});

describe('extractUrls', () => {
  it('finds links inside a message and strips trailing punctuation', () => {
    const urls = extractUrls('Verify at https://secure-bank.example/login, then reply.');
    expect(urls).toEqual(['https://secure-bank.example/login']);
  });

  it('deduplicates and respects the limit', () => {
    const text = 'a https://x.example b https://x.example c https://y.example';
    expect(extractUrls(text)).toEqual(['https://x.example', 'https://y.example']);
    expect(extractUrls(text, 1)).toHaveLength(1);
  });

  it('returns nothing when there is no link', () => {
    expect(extractUrls('just some ordinary text')).toEqual([]);
  });
});
