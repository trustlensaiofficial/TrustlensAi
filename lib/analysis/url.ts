import type { Signal } from './types';

/**
 * Structural URL analysis. Entirely offline: these conclusions come from the
 * shape of the URL itself, so they are safe to show even when we never contact
 * the host. Anything requiring a network request lives in `evidence.ts`.
 */

/**
 * Multi-part public suffixes we need to resolve the registrable domain
 * correctly. This is a pragmatic subset, not the full Public Suffix List, so
 * `getRegistrableDomain` is documented as approximate in the report.
 */
const MULTI_PART_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'gov.uk', 'ac.uk', 'me.uk',
  'co.in', 'net.in', 'org.in', 'gov.in', 'ac.in', 'res.in', 'firm.in',
  'com.au', 'net.au', 'org.au', 'gov.au', 'edu.au',
  'co.jp', 'or.jp', 'ne.jp', 'go.jp',
  'com.br', 'com.cn', 'com.sg', 'com.my', 'com.pk', 'com.bd',
  'co.za', 'co.nz', 'co.kr', 'co.id', 'co.th',
  'com.tr', 'com.mx', 'com.ar', 'com.hk', 'com.tw', 'com.ph', 'com.sa', 'com.eg',
]);

/** TLDs that are cheap, bulk-registrable and heavily abused in phishing. */
const HIGH_ABUSE_TLDS = new Set([
  'zip', 'mov', 'top', 'xyz', 'tk', 'ml', 'ga', 'cf', 'gq', 'buzz', 'click',
  'link', 'rest', 'country', 'kim', 'work', 'support', 'fit', 'loan', 'date',
  'review', 'cam', 'quest', 'cfd', 'sbs', 'lol', 'icu', 'bond', 'autos',
]);

const SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly',
  'rebrand.ly', 'cutt.ly', 'shorturl.at', 'tiny.cc', 'rb.gy', 'bl.ink',
  't.ly', 'short.io', 'x.co', 'lnkd.in', 'surl.li', 'clck.ru',
]);

/** Brands whose names are commonly borrowed, with their real domains. */
const BRANDS: Record<string, string[]> = {
  paypal: ['paypal.com'],
  microsoft: ['microsoft.com', 'live.com', 'office.com', 'outlook.com', 'microsoftonline.com'],
  apple: ['apple.com', 'icloud.com'],
  google: ['google.com', 'gmail.com', 'youtube.com', 'googlemail.com'],
  amazon: ['amazon.com', 'amazon.in', 'amazon.co.uk', 'amazonaws.com'],
  netflix: ['netflix.com'],
  facebook: ['facebook.com', 'fb.com'],
  instagram: ['instagram.com'],
  whatsapp: ['whatsapp.com'],
  linkedin: ['linkedin.com'],
  dhl: ['dhl.com'],
  fedex: ['fedex.com'],
  irs: ['irs.gov'],
  hdfcbank: ['hdfcbank.com'],
  icicibank: ['icicibank.com'],
  onlinesbi: ['onlinesbi.sbi', 'sbi.co.in'],
  binance: ['binance.com'],
  coinbase: ['coinbase.com'],
};

export interface ParsedUrl {
  href: string;
  protocol: string;
  hostname: string;
  registrableDomain: string;
  tld: string;
  subdomains: string[];
  port: string;
  pathname: string;
  hasEmbeddedCredentials: boolean;
  isIpLiteral: boolean;
  isPunycode: boolean;
  /**
   * False when the user pasted a bare host and we supplied http:// ourselves.
   * Without this the "no TLS" rule fires on input that never claimed http,
   * which is a finding the product invented rather than observed.
   */
  schemeWasExplicit: boolean;
}

/** Approximate eTLD+1. Documented as approximate wherever it is surfaced. */
export function getRegistrableDomain(hostname: string): string {
  const parts = hostname.toLowerCase().replace(/\.$/, '').split('.');
  if (parts.length <= 2) return parts.join('.');
  const lastTwo = parts.slice(-2).join('.');
  if (MULTI_PART_SUFFIXES.has(lastTwo)) return parts.slice(-3).join('.');
  return lastTwo;
}

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

export function parseUrl(raw: string): ParsedUrl | null {
  let candidate = raw.trim();
  const schemeWasExplicit = /^[a-z][a-z0-9+.-]*:\/\//i.test(candidate);
  if (!schemeWasExplicit) candidate = `http://${candidate}`;
  let u: URL;
  try {
    u = new URL(candidate);
  } catch {
    return null;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;

  const hostname = u.hostname.toLowerCase();
  const isIpLiteral = IPV4.test(hostname) || hostname.includes(':') || u.hostname.startsWith('[');
  const registrableDomain = isIpLiteral ? hostname : getRegistrableDomain(hostname);
  const hostParts = hostname.split('.');
  const regParts = registrableDomain.split('.');
  const subdomains = isIpLiteral ? [] : hostParts.slice(0, Math.max(0, hostParts.length - regParts.length));

  return {
    href: u.href,
    protocol: u.protocol.replace(':', ''),
    hostname,
    registrableDomain,
    tld: isIpLiteral ? '' : (hostParts[hostParts.length - 1] ?? ''),
    subdomains,
    port: u.port,
    pathname: u.pathname,
    hasEmbeddedCredentials: Boolean(u.username || u.password),
    isIpLiteral,
    isPunycode: hostname.split('.').some((l) => l.startsWith('xn--')),
    schemeWasExplicit,
  };
}

/** Normalises common homoglyph substitutions before comparing to a brand. */
function skeleton(label: string): string {
  return label
    .toLowerCase()
    .replace(/[0]/g, 'o')
    .replace(/[1!|]/g, 'l')
    .replace(/[3]/g, 'e')
    .replace(/[4]/g, 'a')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[8]/g, 'b')
    .replace(/[^a-z]/g, '');
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(
        (row[j - 1] ?? 0) + 1,
        (prev[j] ?? 0) + 1,
        (prev[j - 1] ?? 0) + cost,
      );
    }
    prev = row;
  }
  return prev[b.length] ?? 0;
}

function brandSignals(p: ParsedUrl): Signal[] {
  if (p.isIpLiteral) return [];
  const out: Signal[] = [];
  const regLabel = p.registrableDomain.split('.')[0] ?? '';
  const regSkeleton = skeleton(regLabel);
  const fullHost = p.hostname;

  for (const [brand, legitimate] of Object.entries(BRANDS)) {
    const isLegit = legitimate.some(
      (d) => p.registrableDomain === d || p.registrableDomain.endsWith(`.${d}`),
    );
    if (isLegit) continue;

    // Case 1: brand name appears somewhere in the host or path, but the
    // registrable domain belongs to someone else.
    const inSubdomain = p.subdomains.some((s) => skeleton(s).includes(brand));
    const inPath = p.pathname.toLowerCase().includes(brand);
    if (inSubdomain || inPath) {
      out.push({
        id: `url.brand_mismatch.${brand}`,
        title: `"${brand}" appears in the address, but the domain is ${p.registrableDomain}`,
        category: 'domain',
        severity: 'critical',
        explanation:
          `Only the registrable domain decides who controls a site. Here that is "${p.registrableDomain}", not ${brand}. Anyone can put a brand name in a subdomain or path.`,
        matches: [{ text: fullHost, start: 0, end: fullHost.length, note: `registrable domain: ${p.registrableDomain}` }],
      });
      continue;
    }

    const match = [{ text: p.registrableDomain, start: 0, end: p.registrableDomain.length }];

    // Case 2: the label normalises to the brand but is not spelled that way —
    // a homoglyph substitution such as "paypa1" or "g00gle". Visually identical
    // at a glance, so this is the strongest lookalike evidence there is.
    if (regLabel !== brand && regSkeleton === brand) {
      out.push({
        id: `url.lookalike.${brand}`,
        title: `Domain is a character-swap imitation of "${brand}"`,
        category: 'domain',
        severity: 'critical',
        explanation:
          `"${regLabel}" is not "${brand}", but it is built to look identical — digits and letters have been substituted so the two read the same at a glance. This is a deliberate imitation, not a coincidence.`,
        matches: match,
      });
      continue;
    }

    // Case 3: a near-miss misspelling, e.g. "micrsoft" or "paypall".
    const distance = levenshtein(regSkeleton, brand);
    if (regSkeleton !== brand && distance > 0 && distance <= (brand.length >= 8 ? 2 : 1)) {
      out.push({
        id: `url.lookalike.${brand}`,
        title: `Domain closely resembles "${brand}"`,
        category: 'domain',
        severity: 'critical',
        explanation:
          `"${regLabel}" differs from "${brand}" by ${distance} character${distance === 1 ? '' : 's'}. Near-miss spellings are registered specifically to be misread at a glance.`,
        matches: match,
      });
      continue;
    }

    // Case 4: the exact brand name, but on a domain we do not hold on record
    // as official. Deliberately rated medium: our list of official domains is
    // not exhaustive, and a real regional domain can land here.
    if (regLabel === brand) {
      out.push({
        id: `url.unverified_brand_domain.${brand}`,
        title: `Uses the name "${brand}" on a domain not on our known-official list`,
        category: 'domain',
        severity: 'medium',
        explanation:
          `The domain "${p.registrableDomain}" carries the ${brand} name but is not one of the official domains we hold on record. Our list is not exhaustive, so this may be a legitimate regional site — confirm it from ${brand}'s own app or a address you type yourself before trusting it.`,
        matches: match,
      });
    }
  }
  return out;
}

/** All offline signals derivable from a single URL. */
export function analyzeUrlStructure(raw: string): { parsed: ParsedUrl | null; signals: Signal[] } {
  const parsed = parseUrl(raw);
  if (!parsed) return { parsed: null, signals: [] };
  const signals: Signal[] = [];
  const host = parsed.hostname;
  const whole = (t: string) => [{ text: t, start: 0, end: t.length }];

  if (parsed.hasEmbeddedCredentials) {
    signals.push({
      id: 'url.embedded_credentials',
      title: 'Username embedded before the @ sign',
      category: 'domain',
      severity: 'critical',
      explanation:
        'Text before an "@" in a URL is ignored by the browser. It is used to make the address appear to point at a trusted site when the real host is whatever follows the @.',
      matches: whole(parsed.href),
    });
  }

  if (parsed.isIpLiteral) {
    signals.push({
      id: 'url.ip_literal',
      title: 'Address is a raw IP, not a domain name',
      category: 'domain',
      severity: 'high',
      explanation:
        'Legitimate consumer services are reached by domain name. A bare IP address has no certificate identity you can check and no registration record tying it to an organisation.',
      matches: whole(host),
    });
  }

  if (parsed.isPunycode) {
    signals.push({
      id: 'url.punycode',
      title: 'Domain uses punycode (non-Latin characters)',
      category: 'domain',
      severity: 'high',
      explanation:
        'An "xn--" label means the domain contains non-Latin characters, which can render as letters visually identical to a familiar brand while being a completely different domain.',
      matches: whole(host),
    });
  }

  // Only when the user actually wrote http:// — see `schemeWasExplicit`.
  if (parsed.protocol === 'http' && parsed.schemeWasExplicit) {
    signals.push({
      id: 'url.no_tls',
      title: 'Link uses http, not https',
      category: 'link',
      severity: 'medium',
      explanation:
        'Without TLS the connection is unencrypted and the site identity is unverified. Any data entered can be read or altered in transit.',
      matches: whole(parsed.href),
    });
  }

  if (SHORTENERS.has(parsed.registrableDomain)) {
    signals.push({
      id: 'url.shortener',
      title: 'Shortened link conceals the real destination',
      category: 'link',
      severity: 'medium',
      explanation:
        'A shortener hides where the link actually goes, so none of the usual domain checks can be applied before you click.',
      matches: whole(host),
    });
  }

  if (parsed.tld && HIGH_ABUSE_TLDS.has(parsed.tld)) {
    signals.push({
      id: 'url.high_abuse_tld',
      title: `Uses the .${parsed.tld} top-level domain`,
      category: 'domain',
      severity: 'medium',
      explanation:
        `.${parsed.tld} domains are inexpensive and registrable in bulk, which makes them common in short-lived phishing campaigns. This alone is not proof of wrongdoing.`,
      matches: whole(host),
    });
  }

  if (parsed.subdomains.length >= 3) {
    signals.push({
      id: 'url.deep_subdomains',
      title: 'Unusually long chain of subdomains',
      category: 'domain',
      severity: 'low',
      explanation:
        'Long subdomain chains push the real registrable domain out of view, especially on mobile where the address bar truncates.',
      matches: whole(host),
    });
  }

  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    signals.push({
      id: 'url.nonstandard_port',
      title: `Connects on non-standard port ${parsed.port}`,
      category: 'domain',
      severity: 'low',
      explanation:
        'Consumer services run on the default web ports. A custom port often indicates an ad-hoc or temporary host.',
      matches: whole(parsed.href),
    });
  }

  signals.push(...brandSignals(parsed));
  return { parsed, signals };
}

/** Finds URLs inside free text so a pasted message can have its links checked. */
export function extractUrls(text: string, limit = 5): string[] {
  const re = /\b((?:https?:\/\/|www\.)[^\s<>"')\]]+)/gi;
  const seen = new Set<string>();
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null && out.length < limit) {
    const raw = (m[1] ?? '').replace(/[.,;:!?]+$/, '');
    if (!raw || seen.has(raw)) continue;
    seen.add(raw);
    out.push(raw);
  }
  return out;
}
