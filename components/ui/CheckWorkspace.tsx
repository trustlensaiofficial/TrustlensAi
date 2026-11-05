'use client';

import { useCallback, useRef, useState } from 'react';
import type { InputContext, Report } from '@/lib/analysis/types';
import { DEMO_CASES } from '@/lib/demo/cases';
import { LANGS, LANG_LABEL, LANG_NOTE, type Lang } from '@/lib/i18n/strings';
import { saveLocalReport } from '@/lib/offline/local-reports';
import { useOnline } from './OnlineBadge';
import { ReportView } from './ReportView';
import { Kaval } from './Kaval';
import { Alert, Bolt, Doc, Globe, Lens, Lock, Phone, Scales, Spark } from './icons';

/** What the user says they are holding. The rule set changes with it. */
const CONTEXTS: Array<{ id: InputContext; label: string; hint: string; icon: React.ReactNode }> = [
  { id: 'bank_scam', label: 'Bank or payment', hint: 'Bank, UPI, OTP, refund', icon: <Phone /> },
  { id: 'generic', label: 'Message or chat', hint: 'SMS, WhatsApp, email', icon: <Doc /> },
  { id: 'website', label: 'Link or website', hint: 'A URL you were sent', icon: <Globe /> },
  { id: 'job_offer', label: 'Job offer', hint: 'Recruitment message', icon: <Spark /> },
  { id: 'invoice', label: 'Invoice or bill', hint: 'Payment request', icon: <Scales /> },
  { id: 'proposal', label: 'Investment', hint: 'Returns, deposits', icon: <Bolt /> },
];

type Phase = 'idle' | 'running' | 'done' | 'error';

export function CheckWorkspace({ defaultContext = 'bank_scam' }: { defaultContext?: InputContext }) {
  const [context, setContext] = useState<InputContext>(defaultContext);
  const [text, setText] = useState('');
  const [liveChecks, setLiveChecks] = useState(false);
  const [allowCloudAi, setAllowCloudAI] = useState(false);
  const [saveToAccount, setSaveToAccount] = useState(false);
  const [storageNote, setStorageNote] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>('en');
  const [phase, setPhase] = useState<Phase>('idle');
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const online = useOnline();

  const run = useCallback(
    async (body: Record<string, unknown>) => {
      setPhase('running');
      setError(null);
      try {
        /*
         * The versioned endpoint. `/api/analyze` is a deprecated alias onto
         * the same handler and will be removed; a client that keeps using it
         * is relying on a path the contract no longer documents.
         */
        const res = await fetch('/api/v1/analyses', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'X-TrustLens-Platform': 'web' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setPhase('error');
          setError(typeof data?.error === 'string' ? data.error : 'That analysis could not be completed.');
          return;
        }
        setReport(data.report as Report);
        setStorageNote(typeof data.storageNote === 'string' ? data.storageNote : null);
        setPhase('done');
        // Kept locally so history survives a reload and works offline. This is
        // the user's own device only — nothing is uploaded by saving it.
        void saveLocalReport(data.report as Report);
        requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      } catch {
        setPhase('error');
        setError(
          online
            ? 'The analysis service could not be reached. Please try again.'
            : 'You are offline, so this check could not run. Reconnect and try again — your saved reports still open offline.',
        );
      }
    },
    [online],
  );

  const analyse = useCallback(() => {
    if (text.trim().length < 8) {
      setPhase('error');
      setError('Paste a little more of the message so the wording can be examined.');
      return;
    }
    void run({
      text,
      context,
      kind: context === 'website' ? 'url' : 'message',
      liveChecks: liveChecks && online,
      allowCloudAi,
      saveToAccount,
    });
  }, [text, context, liveChecks, allowCloudAi, saveToAccount, online, run]);

  const busy = phase === 'running';

  return (
    <div className="check">
      <div className="check-grid">
        <div className="check-main">
          {/* 1 — what are you looking at */}
          <fieldset className="check-block">
            <legend className="label">1 · What are you checking?</legend>
            <div className="ctx-grid">
              {CONTEXTS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`ctx${context === c.id ? ' ctx-on' : ''}`}
                  aria-pressed={context === c.id}
                  onClick={() => setContext(c.id)}
                >
                  <span className="ctx-icon" aria-hidden="true">{c.icon}</span>
                  <span className="ctx-label">{c.label}</span>
                  <span className="ctx-hint">{c.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* 2 — the text */}
          <div className="check-block">
            <label className="label" htmlFor="tl-text">2 · Paste the message, or the link</label>
            <textarea
              id="tl-text"
              className="field check-field"
              rows={7}
              value={text}
              maxLength={8000}
              placeholder="Paste the full message here. Links inside it are examined too."
              onChange={(e) => setText(e.target.value)}
            />
            <div className="check-meta">
              <span className="muted-xs">
                Analysed on the server and treated strictly as data — never as an instruction to the model.
                You do not need to include your own passwords or card numbers.
              </span>
              <span className="muted-xs">{text.length.toLocaleString()} / 8,000</span>
            </div>
          </div>

          {/* 3 — options */}
          <div className="check-block check-options">
            <label className={`switch${!online ? ' switch-off' : ''}`}>
              <input
                type="checkbox"
                checked={liveChecks && online}
                disabled={!online}
                onChange={(e) => setLiveChecks(e.target.checked)}
              />
              <span className="switch-track" aria-hidden="true"><span className="switch-dot" /></span>
              <span>
                <strong>Check links over the network</strong>
                <span className="switch-note">
                  {online
                    ? 'Resolves DNS and reads page metadata only. Private and internal addresses are refused and every redirect is re-validated.'
                    : 'Unavailable offline. The wording and link structure are still checked locally.'}
                </span>
              </span>
            </label>

            <label className="switch">
              <input type="checkbox" checked={allowCloudAi} onChange={(e) => setAllowCloudAI(e.target.checked)} />
              <span className="switch-track" aria-hidden="true"><span className="switch-dot" /></span>
              <span>
                <strong>Allow optional cloud AI explanation</strong>
                <span className="switch-note">
                  Off by default. When enabled, the submitted text, matched warning signs and collected link evidence are sent to TrustLens&apos; configured AI provider. Review the message first and remove OTPs, PINs, passwords and personal details.
                </span>
              </span>
            </label>

            <label className="switch">
              <input type="checkbox" checked={saveToAccount} onChange={(e) => setSaveToAccount(e.target.checked)} />
              <span className="switch-track" aria-hidden="true"><span className="switch-dot" /></span>
              <span>
                <strong>Save an account copy (optional)</strong>
                <span className="switch-note">
                  Off by default. If you are signed in, the report summary, matched excerpts and findings are saved to your TrustLens account. Without sign-in, it stays only in this browser.
                </span>
              </span>
            </label>

            <div className="lang-pick">
              <span className="label">Explain in</span>
              <div className="seg">
                {LANGS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={`seg-btn${lang === l ? ' seg-on' : ''}`}
                    aria-pressed={lang === l}
                    onClick={() => setLang(l)}
                  >
                    {LANG_LABEL[l]}
                  </button>
                ))}
              </div>
              <span className="muted-xs lang-note">{LANG_NOTE[lang]}</span>
            </div>
          </div>

          <div className="check-actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={analyse} disabled={busy}>
              {busy ? <Lens className="spin" /> : <Lens />}
              {busy ? 'Checking…' : 'Check this'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy || (!text && phase === 'idle')}
              onClick={() => { setText(''); setReport(null); setStorageNote(null); setPhase('idle'); setError(null); }}
            >
              Clear
            </button>
          </div>

          {error && (
            <p className="notice notice-high" role="alert">
              <Alert />
              <span>{error}</span>
            </p>
          )}
        </div>

        {/* Examples — real cases, run through the same pipeline. */}
        <aside className="check-side">
          <div className="card card-pad">
            <h3 className="col-head"><Spark /> Try an example</h3>
            <p className="muted-xs" style={{ marginBottom: 'var(--s3)' }}>
              Real demonstration cases, including ordinary messages so you can see it does not
              over-warn. Each runs through the same pipeline as your own text.
            </p>
            <ul className="demo-list">
              {DEMO_CASES.map((d) => (
                <li key={d.slug}>
                  <button
                    type="button"
                    className="demo"
                    disabled={busy}
                    onClick={() => { setContext(d.context); setText(d.text); void run({ demoSlug: d.slug, liveChecks: false, allowCloudAi: false, saveToAccount: false }); }}
                  >
                    <span className="demo-label">{d.label}</span>
                    <span className="demo-why">{d.scenario}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <p className="side-note">
            <Lock />
            Your submitted text is sent to TrustLens for analysis. It is not sent to an external AI provider unless you enable cloud AI above. Account storage is also off unless you explicitly request it.
          </p>
        </aside>
      </div>

      <div ref={resultRef}>
        {busy && (
          <div className="section check-loading" aria-live="polite">
            <div className="skeleton" style={{ height: 96 }} />
            <div className="skeleton" style={{ height: 64, marginTop: 12 }} />
            <div className="skeleton" style={{ height: 64, marginTop: 12 }} />
            <p className="muted-xs" style={{ marginTop: 12 }}>Running fixed rules, then link structure, then the contextual layer…</p>
          </div>
        )}
        {phase === 'done' && report && (
          <div className="section">
            {storageNote && <p className="notice notice-check" role="status">{storageNote}</p>}
            <ReportView report={report} lang={lang} />
          </div>
        )}
      </div>

      <Kaval report={report} />
    </div>
  );
}
