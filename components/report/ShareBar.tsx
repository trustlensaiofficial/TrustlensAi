'use client';

import { useCallback, useState } from 'react';
import type { Report } from '@/lib/analysis/types';
import { SHARE_TARGETS, buildShareText, shareSubject } from '@/lib/share';
import { useProbe } from '@/lib/hooks/use-capability';
import { Check, Copy, Download, Mail, Message, Share, Telegram, WhatsApp } from '@/components/ui/icons';

/**
 * Sharing a finding, and saving it.
 *
 * The native sheet first where it exists, because that is the real
 * integration: the operating system lists every messaging app the person
 * actually has, routes the text itself, and TrustLens never touches WhatsApp
 * or Telegram or their data. Named destinations below it for desktop, where
 * `navigator.share` mostly does not exist.
 *
 * Nothing here sends anything. Every route opens a composer with the text
 * ready and the person presses send — which is also the only honest design,
 * since a product that warns about messages should not be able to send them.
 */

const ICONS = {
  whatsapp: <WhatsApp />,
  telegram: <Telegram />,
  email: <Mail />,
  sms: <Message />,
  copy: <Copy />,
} as const;

export function ShareBar({ report }: { report: Report }) {
  const [includeEvidence, setIncludeEvidence] = useState(false);
  const [copied, setCopied] = useState(false);

  // Read during render rather than from an effect, so the primary control is
  // correct on the first paint instead of swapping a frame later.
  const canShareNatively = useProbe(() => typeof navigator !== 'undefined' && !!navigator.share, false);

  const text = buildShareText(report, { includeEvidence });
  const subject = shareSubject(report);

  const shareNatively = useCallback(async () => {
    try {
      await navigator.share({ title: subject, text });
    } catch (err) {
      // A cancelled sheet throws AbortError. That is a choice, not a failure,
      // and showing an error for it would be wrong.
      if (err instanceof Error && err.name !== 'AbortError') {
        await navigator.clipboard?.writeText(text).catch(() => {});
      }
    }
  }, [subject, text]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard access can be refused outright; say nothing rather than
      // claim a copy that did not happen.
      setCopied(false);
    }
  }, [text]);

  return (
    <section className="share" aria-labelledby="share-title">
      <h2 id="share-title" className="share-title">
        <Share /> Warn someone else
      </h2>
      <p className="share-lede">
        Sends a short summary of what was found — not your whole message.
      </p>

      {canShareNatively && (
        <button type="button" className="share-primary" onClick={() => void shareNatively()}>
          <Share />
          Share…
          <small>WhatsApp, Telegram, email and anything else on this device</small>
        </button>
      )}

      <ul className="share-targets">
        {SHARE_TARGETS.map((target) => {
          if (target.id === 'copy') {
            return (
              <li key={target.id}>
                <button type="button" className="share-target" onClick={() => void copy()}>
                  <span className="share-icon" aria-hidden="true">{copied ? <Check /> : ICONS.copy}</span>
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </li>
            );
          }
          const href = target.href(text, subject);
          if (!href) return null;
          return (
            <li key={target.id}>
              <a
                className="share-target"
                href={href}
                target="_blank"
                // noreferrer as well as noopener: the destination has no
                // business knowing which report page this came from.
                rel="noopener noreferrer"
              >
                <span className={`share-icon share-${target.id}`} aria-hidden="true">{ICONS[target.id]}</span>
                <span>{target.label}</span>
              </a>
            </li>
          );
        })}
      </ul>

      <label className="share-evidence">
        <input
          type="checkbox"
          checked={includeEvidence}
          onChange={(e) => setIncludeEvidence(e.target.checked)}
        />
        <span>
          <strong>Include the exact words that were flagged</strong>
          <small>
            Useful for warning someone — but a real message often carries your name or the
            last digits of your account beside them, and a forward is forever.
          </small>
        </span>
      </label>

      <button type="button" className="share-save" onClick={() => window.print()}>
        <Download />
        Save as PDF
        <small>Opens your printer dialog — choose “Save as PDF”</small>
      </button>
    </section>
  );
}
