import { createHmac } from 'node:crypto';

/**
 * Indicator normalisation for campaign matching.
 *
 * A scam campaign is reused with small edits — a different subdomain, a new
 * number from the same block, reworded text. Matching raw strings would miss
 * every variant, so each indicator is reduced to the part the attacker cannot
 * cheaply change and still run the same campaign.
 *
 * Nothing here handles message bodies. Raw text never leaves the device; only
 * these normalised indicators are ever eligible to be shared, and only with
 * explicit consent.
 */

export type IndicatorKind = 'domain' | 'phone' | 'upi' | 'template';

export interface Indicator {
  kind: IndicatorKind;
  /** The matchable value. For `phone` this is a keyed token, never the number. */
  value: string;
  /** Shown to a human. Redacted for identifiers. */
  label: string;
}

/* ------------------------------------------------------------------ domains */

/**
 * Multi-part public suffixes we care about. A full Public Suffix List would be
 * better and is the production answer; this covers the suffixes that actually
 * appear in Indian financial phishing, and anything unlisted falls back to the
 * last two labels, which is correct for .com/.xyz/.top and most others.
 */
const MULTI_SUFFIX = new Set([
  'co.in', 'net.in', 'org.in', 'gov.in', 'ac.in', 'co.uk', 'com.au', 'co.za',
]);

/** Reduces a URL or host to its registrable domain, so subdomains collapse. */
export function registrableDomain(input: string): string | null {
  let host = input.trim().toLowerCase();
  if (!host) return null;
  try {
    host = new URL(host.includes('://') ? host : `http://${host}`).hostname;
  } catch {
    return null;
  }
  host = host.replace(/\.$/, '');
  if (!host.includes('.')) return null;

  const parts = host.split('.');
  const lastTwo = parts.slice(-2).join('.');
  if (MULTI_SUFFIX.has(lastTwo) && parts.length >= 3) return parts.slice(-3).join('.');
  return lastTwo;
}

/* ------------------------------------------------------------------- phones */

/**
 * Reduces an Indian-style number to its last 10 digits.
 *
 * `+91 98765 43210`, `098765 43210` and `9876543210` are the same subscriber
 * written three ways, and a campaign gets reported in all three.
 */
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/\D+/g, '');
  if (digits.length < 10) return null;
  return digits.slice(-10);
}

/**
 * Turns a phone number into a keyed token for sharing.
 *
 * A plain SHA-256 is NOT anonymisation here: there are only ten billion
 * ten-digit numbers, so the whole space can be hashed and reversed on a
 * laptop. An HMAC under a server-held key removes that offline attack,
 * because an attacker without the key cannot build the rainbow table.
 *
 * The honest limit: anyone who holds the key can still test a guess, so this
 * is pseudonymisation, not anonymity. It protects against a leaked database,
 * not against the operator. A production system would use a rotating key in a
 * KMS and a privacy-preserving set-intersection protocol; that is documented
 * as the next step rather than claimed as built.
 */
export function phoneToken(phone: string, key: string): string | null {
  const normal = normalisePhone(phone);
  if (!normal) return null;
  return createHmac('sha256', key).update(`phone:${normal}`).digest('base64url').slice(0, 22);
}

/** `98765 43210` → `98••••••10`, enough to recognise without republishing it. */
export function redactPhone(phone: string): string {
  const n = normalisePhone(phone);
  if (!n) return 'unknown number';
  return `${n.slice(0, 2)}${'•'.repeat(6)}${n.slice(-2)}`;
}

/* ---------------------------------------------------------------------- UPI */

const UPI_RE = /\b([a-z0-9][a-z0-9._-]{1,48})@([a-z]{2,24})\b/gi;

export function extractUpiHandles(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(UPI_RE)) {
    const handle = `${m[1]}@${m[2]}`.toLowerCase();
    // An email is not a UPI handle; the common mail suffixes are excluded.
    if (/@(gmail|yahoo|outlook|hotmail|proton|icloud|rediffmail)$/.test(handle)) continue;
    out.add(handle);
  }
  return [...out];
}

/* ----------------------------------------------------------------- template */

/**
 * The vocabulary a financial scam actually turns on.
 *
 * An earlier version fingerprinted the most frequent content words, which was
 * far too brittle: adding "Dear customer" to the front shifted the top tokens
 * and two sends of the same campaign stopped matching. Scoring against a fixed
 * salient vocabulary instead means the filler can change freely while the
 * pitch — blocked account, KYC, verify, OTP, refund — still fingerprints the
 * same.
 *
 * It also makes the key honest about what it is: a signature of scam phrasing,
 * not a hash of the message. Ordinary conversation produces no key at all.
 */
/**
 * The vocabulary a financial scam turns on, weighted by how much each word
 * actually distinguishes one campaign from another.
 *
 * Two earlier versions were too brittle. Fingerprinting the most frequent
 * content words broke when filler was added; an unweighted salient set broke
 * the same way, because "Dear customer" contributes a salient word and shifted
 * the signature. Weighting fixes it: the signature keeps only the highest-value
 * terms, so filler can change freely while the pitch — blocked, KYC, OTP,
 * refund — still fingerprints identically.
 *
 * 3 = the demand itself, the part a campaign cannot drop and still work.
 * 2 = the mechanism it operates through.
 * 1 = pressure and framing, which rotate freely between sends.
 */
const SALIENT = new Map<string, number>([
  // the demand
  ['kyc', 3], ['otp', 3], ['pin', 3], ['cvv', 3], ['password', 3],
  ['blocked', 3], ['block', 3], ['suspended', 3], ['suspend', 3], ['frozen', 3], ['freeze', 3],
  ['arrest', 3], ['refund', 3], ['guaranteed', 3], ['lottery', 3], ['prize', 3],
  ['reactivate', 3], ['expired', 3], ['expire', 3],
  // the mechanism
  ['verify', 2], ['verification', 2], ['upi', 2], ['netbanking', 2],
  ['deposit', 2], ['fee', 2], ['penalty', 2], ['fine', 2], ['collect', 2],
  ['install', 2], ['download', 2], ['registration', 2], ['loan', 2],
  ['investment', 2], ['returns', 2], ['parcel', 2], ['customs', 2],
  ['police', 2], ['court', 2], ['legal', 2], ['salary', 2], ['interview', 2],
  ['cashback', 2], ['scheme', 2], ['wallet', 2], ['winner', 2], ['won', 2],
  // pressure and framing
  ['account', 1], ['bank', 1], ['card', 1], ['debit', 1], ['credit', 1],
  ['urgent', 1], ['urgently', 1], ['immediately', 1], ['today', 1],
  ['within', 1], ['hours', 1], ['final', 1], ['last', 1], ['warning', 1],
  ['notice', 1], ['alert', 1], ['click', 1], ['link', 1], ['app', 1],
  ['share', 1], ['send', 1], ['customer', 1], ['support', 1], ['helpline', 1],
  ['executive', 1], ['officer', 1], ['department', 1], ['transfer', 1],
  ['transaction', 1], ['payment', 1], ['charge', 1], ['request', 1],
  ['update', 1], ['code', 1], ['claim', 1], ['reward', 1], ['profit', 1],
  ['job', 1], ['offer', 1], ['selected', 1], ['case', 1], ['credential', 1],
]);

/**
 * Only terms at this weight or above enter the signature.
 *
 * The weight-1 tier is framing — "urgent", "today", "customer" — and it was
 * the direct cause of two failed attempts: those words tie with each other,
 * so any added filler reshuffled which ones made the cut. They still help
 * decide whether a message is salient enough to fingerprint at all; they just
 * do not get a vote on the key itself.
 */
const SIGNATURE_MIN_WEIGHT = 2;
/** Enough distinct demand/mechanism terms to be worth fingerprinting. */
const SIGNATURE_MIN_TERMS = 2;
/** Upper bound, so a long message does not produce an unmatchable key. */
const SIGNATURE_MAX_TERMS = 6;

/**
 * A fingerprint of the wording, so reworded variants of one campaign cluster.
 *
 * URLs, handles and numbers are stripped first — those are exactly what the
 * attacker rotates between sends. The remaining salient terms are ranked by
 * weight and the top few are sorted into a stable key, so word order and
 * added filler do not change the result.
 *
 * Lossy by design: it cannot be reversed into the original message, and a
 * message with too little scam vocabulary produces no key at all rather than
 * a weak one that would group unrelated reports.
 */
export function templateKey(text: string): string | null {
  const cleaned = text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\b[\w.-]+@[a-z]{2,}\b/g, ' ')
    .replace(/\d+/g, ' ')
    .replace(/[^a-z\s]/g, ' ');

  const hits = new Map<string, number>();
  for (const word of cleaned.split(/\s+/)) {
    const weight = SALIENT.get(word);
    if (weight !== undefined) hits.set(word, weight);
  }

  // Four salient terms of any weight is the floor for fingerprinting at all:
  // fewer, and ordinary messages that happen to mention a bank start
  // colliding with real campaigns.
  if (hits.size < 4) return null;

  const signature = [...hits.entries()]
    .filter(([, weight]) => weight >= SIGNATURE_MIN_WEIGHT)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, SIGNATURE_MAX_TERMS)
    .map(([word]) => word)
    .sort();

  if (signature.length < SIGNATURE_MIN_TERMS) return null;
  return signature.join('-');
}

/* ------------------------------------------------------------------ extract */

/** Every shareable indicator in one message. Raw text is never included. */
export function extractIndicators(text: string, key: string): Indicator[] {
  const out: Indicator[] = [];
  const seen = new Set<string>();

  const add = (ind: Indicator) => {
    const id = `${ind.kind}:${ind.value}`;
    if (seen.has(id)) return;
    seen.add(id);
    out.push(ind);
  };

  for (const m of text.matchAll(/https?:\/\/[^\s<>"']+/gi)) {
    const dom = registrableDomain(m[0]);
    if (dom) add({ kind: 'domain', value: dom, label: dom });
  }

  // Indian mobile numbers: 10 digits starting 6-9, optionally +91 prefixed.
  for (const m of text.matchAll(/(?:\+?91[\s-]?)?\b([6-9]\d{9})\b/g)) {
    const raw = m[1];
    if (!raw) continue;
    const token = phoneToken(raw, key);
    if (token) add({ kind: 'phone', value: token, label: redactPhone(raw) });
  }

  for (const handle of extractUpiHandles(text)) {
    add({ kind: 'upi', value: handle, label: handle });
  }

  const tpl = templateKey(text);
  if (tpl) add({ kind: 'template', value: tpl, label: 'Wording pattern' });

  return out;
}
