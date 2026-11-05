'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Report } from '@/lib/analysis/types';
import { KAVAL_MEANING, KAVAL_NAME, KAVAL_PROMPTS, KAVAL_REFUSES, KAVAL_SCOPE, type KavalTurn } from '@/lib/assistant/kaval';
import { useOnline } from './OnlineBadge';
import { Alert, Arrow, Check, Close, Shield, Spark } from './icons';

/**
 * Kaval, as a floating panel.
 *
 * Deliberately not a full-screen takeover: someone reading a report should be
 * able to ask about it without losing the report. On a phone it becomes a
 * bottom sheet, which is where a thumb already is.
 */
export function Kaval({ report, showTrigger = false }: { report?: Report | null; showTrigger?: boolean }) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<KavalTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [allowCloudAI, setAllowCloudAI] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const online = useOnline();
  const logRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  /* Keep the newest message in view as the conversation grows. */
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, busy]);

  /* The quick-tools dock can open Kaval without navigating away from a report. */
  useEffect(() => {
    const openFromDock = () => setOpen(true);
    window.addEventListener('trustlens:open-kaval', openFromDock);
    if (window.location.search.includes('assistant=1')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
    return () => window.removeEventListener('trustlens:open-kaval', openFromDock);
  }, []);

  /* Escape closes, which is the behaviour people already expect of a panel. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || busy) return;

      const next: KavalTurn[] = [...turns, { role: 'user', content: message }];
      setTurns(next);
      setDraft('');
      setBusy(true);
      setError(null);
      setNotice(null);

      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          // Only the last few turns travel, to stay fast and cheap.
          body: JSON.stringify({
            messages: next.slice(-10),
            report: report ?? undefined,
            allowCloud: allowCloudAI,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(typeof data?.error === 'string' ? data.error : 'Kaval could not answer that.');
          return;
        }
        setTurns((prev) => [...prev, { role: 'assistant', content: data.reply as string }]);
        setNotice(typeof data.notice === 'string' ? data.notice : null);
      } catch {
        setError(
          online
            ? 'Kaval could not be reached. Everything else still works.'
            : 'Kaval needs a connection. Your saved reports and the response guidance still work offline.',
        );
      } finally {
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    [turns, busy, report, online, allowCloudAI],
  );

  return (
    <>
      {/*
        Off by default. The floating dock owns the entry point now — two
        triggers for one panel is how the product ended up with three things
        floating over a 375px screen at the same time. The flag stays for a
        surface that has no dock.
      */}
      {showTrigger && (
        <button
          type="button"
          className={`kaval-fab${open ? ' kaval-fab-open' : ''}`}
          aria-expanded={open}
          aria-controls="kaval-panel"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="kaval-fab-glow" aria-hidden="true" />
          {open ? <Close /> : <Spark />}
          <span className="kaval-fab-label">{open ? 'Close' : `Ask ${KAVAL_NAME}`}</span>
        </button>
      )}

      {open && (
        <aside id="kaval-panel" className="kaval" role="dialog" aria-label={`${KAVAL_NAME}, the TrustLens assistant`}>
          <header className="kaval-head">
            <span className="kaval-mark" aria-hidden="true"><Shield /></span>
            <div>
              <p className="kaval-name">{KAVAL_NAME}</p>
              <p className="kaval-sub">{KAVAL_MEANING} · the TrustLens assistant</p>
            </div>
            <button type="button" className="btn btn-ghost icon-btn" aria-label="Close" onClick={() => setOpen(false)}>
              <Close />
            </button>
          </header>

          <div className="kaval-log" ref={logRef}>
            {turns.length === 0 && (
              <div className="kaval-intro">
                <p className="kaval-intro-lede">
                  {report
                    ? 'Ask me anything about this report, or about scams in general.'
                    : 'Ask me about scams, or about what to do if something has already happened.'}
                </p>

                <p className="micro-label">I can</p>
                <ul className="tick-list">{KAVAL_SCOPE.map((s) => <li key={s}>{s}</li>)}</ul>

                <p className="micro-label">I will not</p>
                <ul className="tick-list tick-never">{KAVAL_REFUSES.map((s) => <li key={s}>{s}</li>)}</ul>

                <div className="kaval-chips">
                  {KAVAL_PROMPTS.map((p) => (
                    <button key={p} type="button" className="kaval-chip" onClick={() => void send(p)}>{p}</button>
                  ))}
                </div>
              </div>
            )}

            {turns.map((t, i) => (
              <div key={i} className={`kaval-turn kaval-${t.role}`}>
                {t.content.split('\n').filter(Boolean).map((line, j) => <p key={j}>{line}</p>)}
              </div>
            ))}

            {busy && (
              <div className="kaval-turn kaval-assistant kaval-thinking" aria-live="polite">
                <span className="kaval-dot" /><span className="kaval-dot" /><span className="kaval-dot" />
              </div>
            )}

            {error && (
              <p className="notice notice-high kaval-error" role="alert"><Alert /><span>{error}</span></p>
            )}
          </div>

          {notice && <p className="kaval-notice" role="status">{notice}</p>}

          <label className="kaval-cloud-consent">
            <input
              type="checkbox"
              checked={allowCloudAI}
              onChange={(e) => setAllowCloudAI(e.target.checked)}
              disabled={busy}
            />
            <span>
              <strong>Allow external AI for this chat (optional)</strong>
              <span>
                Off by default: Kaval uses its built-in safety guide. When enabled, your recent chat and the visible report context are sent to TrustLens&apos; configured AI provider. Do not include OTPs, PINs or passwords.
              </span>
            </span>
          </label>

          <form
            className="kaval-compose"
            onSubmit={(e) => { e.preventDefault(); void send(draft); }}
          >
            <input
              ref={inputRef}
              className="field kaval-input"
              value={draft}
              maxLength={2000}
              placeholder={online ? 'Ask about a scam…' : 'Kaval needs a connection'}
              disabled={busy || !online}
              onChange={(e) => setDraft(e.target.value)}
              aria-label={`Message ${KAVAL_NAME}`}
            />
            <button type="submit" className="btn btn-primary kaval-send" disabled={busy || !draft.trim() || !online} aria-label="Send">
              <Arrow />
            </button>
          </form>

          <p className="kaval-foot">
            <Check />
            Kaval explains and guides. It never declares anything genuine, and never asks for a
            code, PIN or password.
          </p>
        </aside>
      )}
    </>
  );
}
