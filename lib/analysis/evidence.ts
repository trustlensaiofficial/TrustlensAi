import { lookup } from 'node:dns/promises';
import type { EvidenceRecord } from './types';
import { parseUrl, type ParsedUrl } from './url';

/**
 * Network evidence collection.
 *
 * Everything here runs server-side only and operates on a URL that came from
 * untrusted input, so the threat model is SSRF first: the attacker chooses the
 * address we connect to. Defences, in order:
 *
 *  1. Scheme allow-list (http/https only) — no file:, gopher:, data:.
 *  2. DNS resolution up front, with every returned address checked against
 *     private, loopback, link-local and reserved ranges.
 *  3. Redirects are never followed automatically; each hop is re-validated.
 *  4. Hard timeout and a response byte cap, so a hostile host cannot hang or
 *     exhaust the function.
 *  5. We only ever read metadata (status, headers, <title>, description).
 *     Nothing is executed, downloaded to disk, or rendered.
 *
 * Known limitation, stated in the report rather than hidden: we validate the
 * resolved addresses and then connect by hostname, so a DNS record that changes
 * between the check and the request (DNS rebinding) is not fully prevented.
 * Closing that needs connection-level IP pinning, which the platform fetch
 * does not expose.
 */

const REQUEST_TIMEOUT_MS = 6_000;
const MAX_RESPONSE_BYTES = 256 * 1024;
const MAX_REDIRECT_HOPS = 2;
const USER_AGENT = 'TrustLensAI-Verifier/1.0 (+metadata-only; does not execute content)';

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = n * 256 + v;
  }
  return n;
}

/** CIDR blocks that must never be reachable from a user-supplied URL. */
const BLOCKED_V4: Array<[string, number]> = [
  ['0.0.0.0', 8],        // "this network"
  ['10.0.0.0', 8],       // private
  ['100.64.0.0', 10],    // carrier NAT
  ['127.0.0.0', 8],      // loopback
  ['169.254.0.0', 16],   // link-local, incl. cloud metadata 169.254.169.254
  ['172.16.0.0', 12],    // private
  ['192.0.0.0', 24],     // IETF protocol assignments
  ['192.0.2.0', 24],     // documentation
  ['192.168.0.0', 16],   // private
  ['198.18.0.0', 15],    // benchmarking
  ['198.51.100.0', 24],  // documentation
  ['203.0.113.0', 24],   // documentation
  ['224.0.0.0', 4],      // multicast
  ['240.0.0.0', 4],      // reserved
];

export function isBlockedAddress(address: string, family: number): boolean {
  if (family === 4) {
    const n = ipv4ToInt(address);
    if (n === null) return true;
    for (const [base, bits] of BLOCKED_V4) {
      const b = ipv4ToInt(base);
      if (b === null) continue;
      const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
      if ((n & mask) === (b & mask)) return true;
    }
    return false;
  }

  const ip = address.toLowerCase().split('%')[0] ?? '';
  if (ip === '::' || ip === '::1') return true;
  // IPv4-mapped (::ffff:a.b.c.d) must be judged by its IPv4 rules.
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(ip);
  if (mapped?.[1]) return isBlockedAddress(mapped[1], 4);
  const head = ip.split(':')[0] ?? '';
  if (/^f[cd][0-9a-f]{2}$/.test(head)) return true;          // fc00::/7 unique-local
  if (/^fe[89ab][0-9a-f]$/.test(head)) return true;          // fe80::/10 link-local
  if (head === 'ff00' || /^ff[0-9a-f]{2}$/.test(head)) return true; // multicast
  return false;
}

interface GuardResult {
  ok: boolean;
  reason?: string;
  addresses?: string[];
}

async function guardHost(parsed: ParsedUrl): Promise<GuardResult> {
  if (parsed.protocol !== 'http' && parsed.protocol !== 'https') {
    return { ok: false, reason: `scheme "${parsed.protocol}" is not allowed` };
  }
  // A literal IP needs no DNS, but still needs the range check.
  if (parsed.isIpLiteral) {
    const bare = parsed.hostname.replace(/^\[|\]$/g, '');
    const family = bare.includes(':') ? 6 : 4;
    if (isBlockedAddress(bare, family)) {
      return { ok: false, reason: 'address is in a private or reserved range' };
    }
    return { ok: true, addresses: [bare] };
  }

  let resolved: Array<{ address: string; family: number }>;
  try {
    resolved = await lookup(parsed.hostname, { all: true });
  } catch (err) {
    const code = (err as { code?: string }).code ?? 'unknown';
    return { ok: false, reason: `DNS lookup failed (${code})` };
  }
  if (resolved.length === 0) return { ok: false, reason: 'hostname resolved to no addresses' };

  for (const r of resolved) {
    if (isBlockedAddress(r.address, r.family)) {
      return { ok: false, reason: 'hostname resolves into a private or reserved range' };
    }
  }
  return { ok: true, addresses: resolved.map((r) => r.address) };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function extractMeta(html: string): { title?: string; description?: string } {
  const title = /<title[^>]*>([\s\S]{0,300}?)<\/title>/i.exec(html)?.[1];
  const desc =
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']{0,400})["']/i.exec(html)?.[1] ??
    /<meta[^>]+content=["']([^"']{0,400})["'][^>]+name=["']description["']/i.exec(html)?.[1];
  return {
    title: title ? decodeEntities(title.replace(/\s+/g, ' ').trim()).slice(0, 200) : undefined,
    description: desc ? decodeEntities(desc.replace(/\s+/g, ' ').trim()).slice(0, 300) : undefined,
  };
}

/** Reads at most `MAX_RESPONSE_BYTES`, then aborts. */
async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        total += value.byteLength;
        if (total >= MAX_RESPONSE_BYTES) break;
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const buf = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    buf.set(c.subarray(0, Math.min(c.byteLength, total - offset)), offset);
    offset += c.byteLength;
    if (offset >= total) break;
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(buf);
}

/**
 * Inspects a URL over the network and returns evidence records describing
 * exactly what was and was not established.
 */
export async function collectUrlEvidence(rawUrl: string): Promise<EvidenceRecord[]> {
  const now = () => new Date().toISOString();
  const records: EvidenceRecord[] = [];
  const parsed = parseUrl(rawUrl);

  if (!parsed) {
    records.push({
      id: 'ev.parse',
      source: 'URL parser',
      method: 'WHATWG URL parsing, offline',
      detail: 'The address could not be parsed as an http or https URL, so no network check was attempted.',
      status: 'failed',
      retrievedAt: now(),
    });
    return records;
  }

  records.push({
    id: 'ev.registrable_domain',
    source: 'URL structure',
    method: 'Offline parsing with an approximate public-suffix list',
    detail: `The registrable domain — the part that identifies who controls this address — is "${parsed.registrableDomain}". Full hostname: "${parsed.hostname}".`,
    url: parsed.href,
    status: 'observed',
    retrievedAt: now(),
  });

  const guard = await guardHost(parsed);
  if (!guard.ok) {
    records.push({
      id: 'ev.dns',
      source: 'DNS resolution',
      method: 'Server-side DNS lookup with private-range filtering',
      detail: `No request was sent: ${guard.reason}.`,
      url: parsed.href,
      status: guard.reason?.startsWith('DNS lookup failed') ? 'unresolved' : 'failed',
      retrievedAt: now(),
    });
    records.push({
      id: 'ev.http',
      source: 'HTTP response',
      method: 'Blocked before any connection was made',
      detail: 'The page was not contacted, so nothing is known about its content, certificate or behaviour.',
      status: 'not_checked',
    });
    return records;
  }

  records.push({
    id: 'ev.dns',
    source: 'DNS resolution',
    method: 'Server-side DNS lookup with private-range filtering',
    detail: `"${parsed.hostname}" resolved to ${guard.addresses?.length ?? 0} public address(es). No address fell in a private, loopback or link-local range.`,
    url: parsed.href,
    status: 'observed',
    retrievedAt: now(),
  });

  // Walk redirects manually, re-validating every hop.
  let current = parsed;
  const hops: string[] = [];
  for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(current.href, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,*/*;q=0.5' },
      });
    } catch (err) {
      clearTimeout(timer);
      const aborted = (err as Error).name === 'AbortError';
      records.push({
        id: 'ev.http',
        source: 'HTTP response',
        method: `GET with ${REQUEST_TIMEOUT_MS / 1000}s timeout, redirects not auto-followed`,
        detail: aborted
          ? `The host did not respond within ${REQUEST_TIMEOUT_MS / 1000} seconds. Whether the page exists is unknown.`
          : 'The connection failed before a response was received. Whether the page exists is unknown.',
        url: current.href,
        status: aborted ? 'unresolved' : 'failed',
        retrievedAt: now(),
      });
      return records;
    }
    clearTimeout(timer);

    const status = res.status;
    const location = res.headers.get('location');

    if (status >= 300 && status < 400 && location) {
      let next: ParsedUrl | null = null;
      try {
        next = parseUrl(new URL(location, current.href).href);
      } catch {
        next = null;
      }
      hops.push(`${status} → ${location}`);

      if (hop === MAX_REDIRECT_HOPS || !next) {
        records.push({
          id: 'ev.redirect',
          source: 'HTTP redirects',
          method: 'Manual redirect walk, each hop re-validated',
          detail: `Redirect chain observed: ${hops.join(' | ')}. The chain was not followed further${next ? ' because the hop limit was reached' : ' because the target could not be parsed'}, so the final destination is unverified.`,
          url: parsed.href,
          status: 'unresolved',
          retrievedAt: now(),
        });
        return records;
      }

      const nextGuard = await guardHost(next);
      if (!nextGuard.ok) {
        records.push({
          id: 'ev.redirect',
          source: 'HTTP redirects',
          method: 'Manual redirect walk, each hop re-validated',
          detail: `The link redirects to "${next.hostname}", which was not followed: ${nextGuard.reason}. A redirect toward an internal address is itself a strong warning sign.`,
          url: parsed.href,
          status: 'observed',
          retrievedAt: now(),
        });
        return records;
      }
      current = next;
      continue;
    }

    if (hops.length > 0) {
      records.push({
        id: 'ev.redirect',
        source: 'HTTP redirects',
        method: 'Manual redirect walk, each hop re-validated',
        detail: `Redirect chain followed: ${hops.join(' | ')}. Final address: ${current.href} (registrable domain "${current.registrableDomain}").`,
        url: parsed.href,
        status: 'observed',
        retrievedAt: now(),
      });
    }

    const contentType = res.headers.get('content-type') ?? 'not stated';
    let detail = `The host returned HTTP ${status} (${res.statusText || 'no status text'}) with content type "${contentType}".`;
    if (contentType.includes('text/html')) {
      const html = await readCapped(res);
      const meta = extractMeta(html);
      if (meta.title) detail += ` Page title: "${meta.title}".`;
      if (meta.description) detail += ` Stated description: "${meta.description}".`;
      if (!meta.title && !meta.description) {
        detail += ' The page declared no title or description.';
      }
    } else {
      detail += ' The body was not HTML, so no page title was read.';
    }
    detail += ' Only metadata was read; no content was executed or stored.';

    records.push({
      id: 'ev.http',
      source: 'HTTP response',
      method: `GET with ${REQUEST_TIMEOUT_MS / 1000}s timeout and a ${Math.round(MAX_RESPONSE_BYTES / 1024)}KB read cap`,
      detail,
      url: current.href,
      status: 'observed',
      retrievedAt: now(),
    });
    return records;
  }

  return records;
}

/** Evidence placeholder used when live checking is disabled or not applicable. */
export function notCheckedEvidence(reason: string): EvidenceRecord {
  return {
    id: 'ev.http',
    source: 'Live source check',
    method: 'Not run',
    detail: reason,
    status: 'not_checked',
  };
}
