/**
 * Sharing, in and out.
 *
 * Both directions have a failure mode that is invisible in development and
 * obvious to a user:
 *
 *   Out — a digest that loses the "no rules matched is not the same as safe"
 *   line is actively dangerous once forwarded, because the interface that
 *   would otherwise carry that caveat does not travel with it.
 *
 *   In — the Android share sheet does not say which of its three parameters
 *   holds the message, and getting it wrong puts the sending app's own name
 *   into someone's message. That was a real bug: a share from WhatsApp
 *   arrived as "WhatsApp" followed by the text.
 */

import { describe, expect, it } from 'vitest';
import type { Report } from '../lib/analysis/types';
import {
  SHARE_TARGETS,
  buildShareText,
  contextForShared,
  mergeSharedPayload,
  shareSubject,
} from '../lib/share';

function report(over: Partial<Report> = {}): Report {
  return {
    id: 'r1',
    inputKind: 'message',
    inputContext: 'bank_scam',
    inputPreview: 'Share the OTP to avoid blocking',
    createdAt: new Date('2026-11-05T10:00:00Z').toISOString(),
    assessment: {
      level: 'high_risk',
      headline: 'Multiple strong warning signs',
      summary: '3 of 43 rules matched.',
      signalScore: 38,
    },
    signals: [
      { id: 's1', title: 'Request for an OTP, PIN or password', category: 'credentials', severity: 'critical', explanation: 'x', matches: [{ text: 'share the OTP', start: 0, end: 13 }] },
      { id: 's2', title: 'Threat that the account will be blocked', category: 'threat', severity: 'high', explanation: 'x', matches: [{ text: 'account will be blocked', start: 0, end: 23 }] },
      { id: 's3', title: 'Artificial time pressure', category: 'urgency', severity: 'medium', explanation: 'x', matches: [] },
      { id: 's4', title: 'Link uses http, not https', category: 'link', severity: 'medium', explanation: 'x', matches: [] },
    ],
    checklist: [],
    unknowns: [],
    ...over,
  } as Report;
}

describe('the digest that goes to WhatsApp', () => {
  it('leads with the verdict, so a forward is readable at a glance', () => {
    expect(buildShareText(report())).toMatch(/^TrustLens AI checked this: STRONG WARNING SIGNS/);
  });

  it('lists at most three findings and counts the rest', () => {
    const text = buildShareText(report());
    expect(text).toContain('• Request for an OTP, PIN or password');
    expect(text).toContain('• …and 1 more');
  });

  it('always carries somewhere the recipient can check their own message', () => {
    expect(buildShareText(report())).toContain('https://trustlens.in');
  });

  it('never includes the message text unless asked', () => {
    // The excerpts are the scammer's words, but a real message carries the
    // recipient's name and account digits beside them, and a forward is forever.
    expect(buildShareText(report())).not.toContain('share the OTP');
    expect(buildShareText(report(), { includeEvidence: true })).toContain('share the OTP');
  });

  it('carries the "not the same as safe" caveat when nothing matched', () => {
    // The single most dangerous thing a share could lose.
    const clean = report({
      assessment: { level: 'no_signals_detected', headline: 'No rules matched', summary: '', signalScore: 0 },
      signals: [],
    });
    expect(buildShareText(clean)).toContain('not the same as safe');
  });

  it('stays short enough to survive an SMS composer', () => {
    // Some Android dialers truncate a sms: body around 500 characters.
    expect(buildShareText(report(), { includeEvidence: true }).length).toBeLessThan(500);
  });
});

describe('the destination links', () => {
  const text = buildShareText(report());
  const subject = shareSubject(report());
  const href = (id: string) => SHARE_TARGETS.find((t) => t.id === id)!.href(text, subject);

  it('uses WhatsApp’s own link format, with no recipient', () => {
    const url = new URL(href('whatsapp')!);
    expect(url.host).toBe('wa.me');
    // No phone number: opens the contact picker, which is what you want when
    // warning several people rather than one.
    expect(url.pathname).toBe('/');
    expect(url.searchParams.get('text')).toBe(text);
  });

  it('gives Telegram the link and the body separately', () => {
    // Passing the whole digest as `text` makes Telegram render the URL twice.
    const url = new URL(href('telegram')!);
    expect(url.searchParams.get('url')).toBe('https://trustlens.in');
    expect(url.searchParams.get('text')).not.toContain('https://trustlens.in');
  });

  it('uses the sms form that works on both platforms', () => {
    // `;body=` is iOS-only and silently drops the text on Android.
    expect(href('sms')).toMatch(/^sms:\?body=/);
  });

  it('puts a subject on the email', () => {
    expect(href('email')).toContain('subject=');
  });

  it('offers copy with no URL', () => {
    expect(href('copy')).toBeNull();
  });
});

describe('receiving a share from the system sheet', () => {
  it('takes the message from text', () => {
    expect(mergeSharedPayload({ text: 'Share the OTP now' })).toBe('Share the OTP now');
  });

  it('drops a one-word title, which is the sending app’s name', () => {
    // The real bug: a share from WhatsApp arrived as "WhatsApp\n<message>",
    // putting a word in the message that nobody wrote.
    expect(mergeSharedPayload({ title: 'WhatsApp', text: 'Share the OTP now' })).toBe('Share the OTP now');
    expect(mergeSharedPayload({ title: 'Telegram', text: 'Pay now' })).toBe('Pay now');
  });

  it('keeps a title that reads like a subject line', () => {
    // An email share puts the hook in the subject as often as in the body.
    expect(mergeSharedPayload({ title: 'Invoice overdue', text: 'Pay to the new account.' }))
      .toBe('Invoice overdue\nPay to the new account.');
  });

  it('falls back to the title when there is no text at all', () => {
    expect(mergeSharedPayload({ title: 'Your parcel is held at customs' }))
      .toBe('Your parcel is held at customs');
  });

  it('appends a shared link, once', () => {
    expect(mergeSharedPayload({ text: 'Is this real?', url: 'http://x.example/a' }))
      .toBe('Is this real?\nhttp://x.example/a');
    // Several apps send the link in both fields.
    expect(mergeSharedPayload({ text: 'Look: http://x.example/a', url: 'http://x.example/a' }))
      .toBe('Look: http://x.example/a');
  });

  it('returns nothing when nothing was shared', () => {
    expect(mergeSharedPayload({})).toBe('');
  });

  it('caps at the analyser’s own input limit', () => {
    expect(mergeSharedPayload({ text: 'a'.repeat(9000) })).toHaveLength(4000);
  });

  it('treats a bare URL as a link check and anything else as a message', () => {
    expect(contextForShared('https://example.com/a')).toBe('website');
    expect(contextForShared('Is https://example.com/a safe?')).toBe('generic');
    expect(contextForShared('Share the OTP')).toBe('generic');
  });
});
