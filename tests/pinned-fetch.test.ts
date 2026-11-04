/**
 * Connection pinning, which closes the DNS-rebinding hole.
 *
 * The old code validated the resolved addresses and then handed the hostname
 * to `fetch`, which resolved it again — so a nameserver with a one-second TTL
 * could answer with a public address for the check and a private one for the
 * connection. These tests prove the socket can now only go where the guard
 * said, including a real rebinding attempt against a live local server.
 */

import { createServer, type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { fetchPinned, pinnedLookup, type PinnedAddress } from '../lib/analysis/pinned-fetch';

/** Collects what the lookup hands back, in Node's callback shape. */
function resolve(
  fn: ReturnType<typeof pinnedLookup>,
  hostname: string,
  options: Parameters<ReturnType<typeof pinnedLookup>>[1],
): { err: NodeJS.ErrnoException | null; address?: unknown; family?: number } {
  let captured: { err: NodeJS.ErrnoException | null; address?: unknown; family?: number } = { err: null };
  fn(hostname, options, (err, address, family) => {
    captured = { err, address, family };
  });
  return captured;
}

const V4: PinnedAddress[] = [{ address: '93.184.216.34', family: 4 }];
const BOTH: PinnedAddress[] = [
  { address: '93.184.216.34', family: 4 },
  { address: '2606:2800:220:1:248:1893:25c8:1946', family: 6 },
];

describe('the lookup only ever returns validated addresses', () => {
  it('returns the pinned address for the validated host', () => {
    const got = resolve(pinnedLookup('example.com', V4), 'example.com', { family: 4 });
    expect(got.err).toBeNull();
    expect(got.address).toBe('93.184.216.34');
    expect(got.family).toBe(4);
  });

  it('returns every pinned address when asked for all', () => {
    const got = resolve(pinnedLookup('example.com', BOTH), 'example.com', { all: true });
    expect(got.err).toBeNull();
    expect(got.address).toEqual([
      { address: '93.184.216.34', family: 4 },
      { address: '2606:2800:220:1:248:1893:25c8:1946', family: 6 },
    ]);
  });

  it('is case-insensitive about the hostname', () => {
    expect(resolve(pinnedLookup('Example.COM', V4), 'example.com', undefined).err).toBeNull();
  });

  it('honours a requested family', () => {
    const v6 = resolve(pinnedLookup('example.com', BOTH), 'example.com', { family: 6 });
    expect(v6.address).toBe('2606:2800:220:1:248:1893:25c8:1946');
    const v4 = resolve(pinnedLookup('example.com', BOTH), 'example.com', { family: 4 });
    expect(v4.address).toBe('93.184.216.34');
  });

  it('understands the string forms of the family', () => {
    // Node passes "IPv4"/"IPv6" in some paths. Reading only the numeric form
    // would treat these as "no preference" and could hand an IPv6 address to
    // a connector that asked for IPv4.
    expect(resolve(pinnedLookup('example.com', BOTH), 'example.com', { family: 'IPv6' }).address)
      .toBe('2606:2800:220:1:248:1893:25c8:1946');
    expect(resolve(pinnedLookup('example.com', BOTH), 'example.com', { family: 'IPv4' }).address)
      .toBe('93.184.216.34');
  });

  it('accepts the family as a bare number, as net.connect passes it', () => {
    expect(resolve(pinnedLookup('example.com', BOTH), 'example.com', 6).address)
      .toBe('2606:2800:220:1:248:1893:25c8:1946');
  });
});

describe('it refuses rather than falling back to DNS', () => {
  it('refuses a host that was never validated', () => {
    // This is the rebinding case. Resolving it here — even correctly — would
    // reopen the hole, so the answer is a refusal, not a lookup.
    const got = resolve(pinnedLookup('example.com', V4), 'evil.example.net', { family: 4 });
    expect(got.err).toBeTruthy();
    expect(got.err!.code).toBe('ERR_TRUSTLENS_HOST_NOT_PINNED');
    expect(got.address).toBeUndefined();
  });

  it('names both hosts in the error, so a log says what happened', () => {
    const got = resolve(pinnedLookup('example.com', V4), '169.254.169.254', undefined);
    expect(got.err!.message).toContain('169.254.169.254');
    expect(got.err!.message).toContain('example.com');
  });

  it('refuses when no validated address matches the requested family', () => {
    const got = resolve(pinnedLookup('example.com', V4), 'example.com', { family: 6 });
    expect(got.err).toBeTruthy();
    expect(got.err!.code).toBe('ENOTFOUND');
  });

  it('refuses when there are no validated addresses at all', () => {
    const got = resolve(pinnedLookup('example.com', []), 'example.com', undefined);
    expect(got.err!.code).toBe('ENOTFOUND');
  });
});

describe('end to end, against a real socket', () => {
  let server: Server;
  let port: number;

  beforeAll(async () => {
    server = createServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end('pinned-ok');
    });
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', () => done()));
    port = (server.address() as { port: number }).port;
  });

  afterAll(async () => {
    await new Promise<void>((done) => server.close(() => done()));
  });

  it('connects when the address is the validated one', async () => {
    // Loopback is blocked by the SSRF guard upstream; this exercises the
    // pinning primitive on its own, which is the layer under test.
    const { response, dispose } = await fetchPinned(
      { href: `http://localhost:${port}/`, hostname: 'localhost' },
      [{ address: '127.0.0.1', family: 4 }],
      { method: 'GET' },
    );
    try {
      expect(response.status).toBe(200);
      // The body must still be readable after fetchPinned returns — an
      // earlier version destroyed the agent too early and broke the stream.
      expect(await response.text()).toBe('pinned-ok');
    } finally {
      await dispose();
    }
  });

  it('cannot reach a server at an address it was not given', async () => {
    /*
     * The rebinding attack, concretely: the host resolves to loopback where
     * the server really is, but we pin to an address where nothing answers.
     * If pinning were ignored the request would succeed.
     */
    await expect(
      fetchPinned(
        { href: `http://localhost:${port}/`, hostname: 'localhost' },
        [{ address: '192.0.2.1', family: 4 }], // documentation range, unroutable
        { method: 'GET', signal: AbortSignal.timeout(3_000) },
      ),
    ).rejects.toThrow();
  });

  it('refuses outright when the host does not match the pin', async () => {
    await expect(
      fetchPinned(
        { href: `http://localhost:${port}/`, hostname: 'localhost' },
        [{ address: '127.0.0.1', family: 4 }],
        { method: 'GET' },
      ).then(async (p) => {
        await p.dispose();
        return p;
      }),
    ).resolves.toBeTruthy();

    // A pin built for a different host must not resolve this one.
    const got = resolve(pinnedLookup('other.example', [{ address: '127.0.0.1', family: 4 }]), 'localhost', undefined);
    expect(got.err!.code).toBe('ERR_TRUSTLENS_HOST_NOT_PINNED');
  });

  it('releasing twice is safe', async () => {
    const { dispose } = await fetchPinned(
      { href: `http://localhost:${port}/`, hostname: 'localhost' },
      [{ address: '127.0.0.1', family: 4 }],
      { method: 'GET' },
    );
    await dispose();
    await expect(dispose()).resolves.toBeUndefined();
  });
});
