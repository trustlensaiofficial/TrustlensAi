import type { Report } from './analysis/types';

/**
 * Sharing a finding out of TrustLens.
 *
 * What is genuinely possible from a web app, and what is not, stated plainly
 * because this is the part people most often overclaim:
 *
 *   * `navigator.share` opens the operating system's own share sheet. On
 *     Android and iOS that sheet contains WhatsApp, Telegram, SMS, Gmail and
 *     everything else installed. This is real integration — the OS does the
 *     routing, and TrustLens never touches those apps or their data.
 *
 *   * Where that API is missing (most desktop browsers) each destination has
 *     a documented URL that pre-fills a message. wa.me and t.me are
 *     WhatsApp's and Telegram's own, `mailto:` and `sms:` are the platform's.
 *     They open a composer with text ready; the person still presses send.
 *
 *   * TrustLens cannot send a message on anyone's behalf, read a reply, or
 *     know whether anything was sent. Nothing here pretends otherwise.
 *
 * Length matters: a WhatsApp forward that runs past a screen is not read, and
 * `sms:` bodies are truncated by some Android dialers around 500 characters.
 * So the share text is a digest, not the report.
 */

const LEVEL_WORD: Record<Report['assessment']['level'], string> = {
  high_risk: 'STRONG WARNING SIGNS',
  elevated_risk: 'SERIOUS WARNING SIGNS',
  some_signals: 'SOME WARNING SIGNS',
  no_signals_detected: 'NO WARNING SIGNS MATCHED',
};

export interface ShareOptions {
  /**
   * Include short excerpts of the message that triggered each finding.
   *
   * Off by default, and that default is deliberate. The excerpts are the
   * scammer's words, which is exactly what makes them useful for warning
   * someone else — but a real message often carries the recipient's name or
   * the last digits of their account alongside them, and a forward is
   * forever. The person decides.
   */
  includeEvidence?: boolean;
  /** Canonical site, appended so a recipient can check their own message. */
  site?: string;
}

/** The digest that travels into WhatsApp, Telegram, email or a text message. */
export function buildShareText(report: Report, options: ShareOptions = {}): string {
  const { includeEvidence = false, site = 'https://trustlens.in' } = options;
  const lines: string[] = [];

  lines.push(`TrustLens AI checked this: ${LEVEL_WORD[report.assessment.level]}`);
  lines.push('');
  lines.push(report.assessment.headline);

  const top = report.signals.slice(0, 3);
  if (top.length > 0) {
    lines.push('');
    lines.push('What it found:');
    for (const signal of top) lines.push(`• ${signal.title}`);
    if (report.signals.length > top.length) {
      lines.push(`• …and ${report.signals.length - top.length} more`);
    }
  }

  if (includeEvidence) {
    const quotes = report.signals
      .flatMap((s) => s.matches.map((m) => m.text))
      .filter(Boolean)
      .slice(0, 2);
    if (quotes.length > 0) {
      lines.push('');
      lines.push('From the message itself:');
      for (const q of quotes) lines.push(`“${trim(q, 90)}”`);
    }
  }

  if (report.assessment.level === 'no_signals_detected') {
    // The one line that must never be dropped. "No warning signs" is not
    // "safe", and a forwarded message loses every bit of interface that
    // would otherwise have said so.
    lines.push('');
    lines.push('No rules matched — that is not the same as safe. Verify through a number you already have.');
  }

  lines.push('');
  lines.push(`Check your own message at ${site}`);

  return lines.join('\n');
}

function trim(value: string, max: number): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

export interface ShareTarget {
  id: 'whatsapp' | 'telegram' | 'email' | 'sms' | 'copy';
  label: string;
  /** null for `copy`, which has no URL. */
  href: (text: string, subject: string) => string | null;
}

export const SHARE_TARGETS: ShareTarget[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    // wa.me is WhatsApp's own documented link format. With no phone number it
    // opens the contact picker rather than a conversation, which is what you
    // want when warning several people.
    href: (text) => `https://wa.me/?text=${encodeURIComponent(text)}`,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    // Telegram's share endpoint wants the link and the text separately, or it
    // renders the URL twice.
    href: (text) => {
      const [body, link] = splitTrailingLink(text);
      return `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(body)}`;
    },
  },
  {
    id: 'email',
    label: 'Email',
    href: (text, subject) => `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`,
  },
  {
    id: 'sms',
    label: 'Text message',
    // `?body=` is the form both iOS and Android accept. The older `;body=`
    // works only on iOS, and silently drops the text everywhere else.
    href: (text) => `sms:?body=${encodeURIComponent(text)}`,
  },
  { id: 'copy', label: 'Copy', href: () => null },
];

/** Splits the trailing "Check your own message at <url>" off the digest. */
function splitTrailingLink(text: string): [string, string] {
  const match = /(https?:\/\/\S+)\s*$/.exec(text);
  if (!match) return [text, 'https://trustlens.in'];
  return [text.slice(0, match.index).trimEnd(), match[1]!];
}

export function shareSubject(report: Report): string {
  return report.assessment.level === 'no_signals_detected'
    ? 'A message I checked with TrustLens AI'
    : 'Warning signs in a message I was sent';
}

/* ----------------------------------------------------- receiving a share */

export interface SharedPayload {
  title?: string | null;
  text?: string | null;
  url?: string | null;
}

/** The analyser's own input ceiling. */
const MAX_SHARED = 4000;

/**
 * Turns an Android share sheet's three parameters into one message.
 *
 * Which parameter holds the message is not obvious, and getting it wrong is
 * visible to the user. The Web Share Target spec defines `text` as the body,
 * and that is what WhatsApp, Telegram and the messages app put there. `title`
 * is a subject line for email — and Android also fills it with the *sending
 * app's own name*, so a share from WhatsApp arrives as "WhatsApp" followed by
 * the message. Pasting that into the box shows the person a word nobody wrote
 * and hands it to the analyser as part of the message.
 *
 * So: `text` is the message. `title` is kept only when it looks like a real
 * subject rather than an app name — the separator is the tell, since an app
 * name is one word and a subject line is a phrase. The heuristic will
 * occasionally drop a one-word subject, which costs a line of context; the
 * opposite error puts words in someone's message.
 *
 * `url` is appended only when it is not already inside the body, because
 * several apps send a link in both.
 */
export function mergeSharedPayload(payload: SharedPayload): string {
  const text = payload.text?.trim() ?? '';
  const url = payload.url?.trim() ?? '';
  const title = payload.title?.trim() ?? '';

  const subjectLooksReal = title.includes(' ') && !text.includes(title);
  const body = text ? (subjectLooksReal ? `${title}\n${text}` : text) : title;

  return [body, url && !body.includes(url) ? url : '']
    .filter(Boolean)
    .join('\n')
    .slice(0, MAX_SHARED);
}

/** A bare URL is a link check; anything else is a message. */
export function contextForShared(shared: string): 'website' | 'generic' {
  return /^https?:\/\/\S+$/i.test(shared.trim()) ? 'website' : 'generic';
}
