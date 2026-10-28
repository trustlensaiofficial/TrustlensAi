import { describe, expect, it } from 'vitest';
import { isBlockedAddress } from '../lib/analysis/evidence';

/**
 * SSRF guard. These are the addresses an attacker would supply to make the
 * server fetch something internal, so each range is asserted explicitly.
 */
describe('isBlockedAddress', () => {
  it('blocks loopback', () => {
    expect(isBlockedAddress('127.0.0.1', 4)).toBe(true);
    expect(isBlockedAddress('127.255.255.254', 4)).toBe(true);
    expect(isBlockedAddress('::1', 6)).toBe(true);
  });

  it('blocks RFC1918 private ranges', () => {
    expect(isBlockedAddress('10.0.0.1', 4)).toBe(true);
    expect(isBlockedAddress('172.16.0.1', 4)).toBe(true);
    expect(isBlockedAddress('172.31.255.255', 4)).toBe(true);
    expect(isBlockedAddress('192.168.1.1', 4)).toBe(true);
  });

  it('blocks the cloud metadata endpoint', () => {
    expect(isBlockedAddress('169.254.169.254', 4)).toBe(true);
  });

  it('blocks carrier NAT, multicast and reserved space', () => {
    expect(isBlockedAddress('100.64.0.1', 4)).toBe(true);
    expect(isBlockedAddress('224.0.0.1', 4)).toBe(true);
    expect(isBlockedAddress('240.0.0.1', 4)).toBe(true);
    expect(isBlockedAddress('0.0.0.0', 4)).toBe(true);
  });

  it('blocks IPv6 unique-local and link-local', () => {
    expect(isBlockedAddress('fc00::1', 6)).toBe(true);
    expect(isBlockedAddress('fd12:3456::1', 6)).toBe(true);
    expect(isBlockedAddress('fe80::1', 6)).toBe(true);
  });

  it('blocks IPv4-mapped IPv6 that wraps a private address', () => {
    expect(isBlockedAddress('::ffff:127.0.0.1', 6)).toBe(true);
    expect(isBlockedAddress('::ffff:10.0.0.1', 6)).toBe(true);
  });

  it('allows ordinary public addresses', () => {
    expect(isBlockedAddress('8.8.8.8', 4)).toBe(false);
    expect(isBlockedAddress('1.1.1.1', 4)).toBe(false);
    expect(isBlockedAddress('2606:4700::1111', 6)).toBe(false);
  });

  it('treats malformed input as blocked rather than allowed', () => {
    expect(isBlockedAddress('not-an-ip', 4)).toBe(true);
    expect(isBlockedAddress('999.1.1.1', 4)).toBe(true);
  });
});
