import type { InputKind } from './types';
import { parseUrl } from './url';

export const MAX_INPUT_LENGTH = 8000;
export const MIN_INPUT_LENGTH = 3;
const PREVIEW_LENGTH = 280;

/**
 * Decides what kind of thing the user pasted when they did not say.
 * Deliberately simple and explainable — the UI always shows the chosen kind
 * and lets the user override it.
 */
export function classifyInput(raw: string): InputKind {
  const text = raw.trim();
  if (!text.includes(' ') && !text.includes('\n') && parseUrl(text)) return 'url';

  const messageMarkers = [
    /\bdear\b/i, /\bhi\b/i, /\bhello\b/i,
    /\byour account\b/i, /\bclick\b/i, /\bcall\b/i, /\breply\b/i,
    /\bpay\b/i, /\botp\b/i, /\bverify\b/i, /\burgent\b/i,
    /https?:\/\//i,
  ];
  const messageScore = messageMarkers.filter((r) => r.test(text)).length;

  // Factual assertions tend to be declarative, third-person and short.
  const claimMarkers = [
    /\bstud(y|ies)\b/i, /\bresearch\b/i, /\bscientists?\b/i, /\bproves?\b/i,
    /\bcauses?\b/i, /\bcures?\b/i, /\bpercent\b|\b%\b/i, /\baccording to\b/i,
  ];
  const claimScore = claimMarkers.filter((r) => r.test(text)).length;

  if (messageScore >= 2 && messageScore >= claimScore) return 'message';
  if (claimScore >= 2) return 'claim';
  return messageScore > 0 ? 'message' : 'claim';
}

export interface ValidationError {
  code: 'empty' | 'too_short' | 'too_long';
  message: string;
}

export function validateInput(raw: unknown): { ok: true; value: string } | { ok: false; error: ValidationError } {
  if (typeof raw !== 'string') {
    return { ok: false, error: { code: 'empty', message: 'Provide the text, link or claim you want analysed.' } };
  }
  const text = raw.trim();
  if (text.length === 0) {
    return { ok: false, error: { code: 'empty', message: 'Provide the text, link or claim you want analysed.' } };
  }
  if (text.length < MIN_INPUT_LENGTH) {
    return { ok: false, error: { code: 'too_short', message: 'That is too short to analyse. Paste the full message or link.' } };
  }
  if (text.length > MAX_INPUT_LENGTH) {
    return {
      ok: false,
      error: {
        code: 'too_long',
        message: `Input is ${text.length.toLocaleString()} characters. The limit is ${MAX_INPUT_LENGTH.toLocaleString()}; paste the most relevant part.`,
      },
    };
  }
  return { ok: true, value: text };
}

/** Short, display-safe echo of the analysed input for report headers. */
export function buildPreview(text: string): string {
  const collapsed = text.replace(/\s+/g, ' ').trim();
  return collapsed.length <= PREVIEW_LENGTH ? collapsed : `${collapsed.slice(0, PREVIEW_LENGTH - 1)}…`;
}
