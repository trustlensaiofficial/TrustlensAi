'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Report } from '@/lib/analysis/types';
import { getLocalReport } from '@/lib/offline/local-reports';
import { Alert, Arrow, Download, Lens, Lock, Phone, Shield } from './icons';

/**
 * A printable evidence summary.
 *
 * Produced through the browser's own print pipeline rather than a PDF
 * library. That is a deliberate trade: `window.print()` costs no dependency,
 * works with no network, honours the user's paper size, and gives better
 * typography than a canvas-drawn PDF. The print stylesheet does the work.
 *
 * What it is NOT is stated on the document itself, because someone will
 * inevitably hand this to a bank or a police station: it is a summary the
 * user prepared, not an official record of anything.
 */

interface Redactions {
  preview: boolean;
  evidence: boolean;
}

function when(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' });
}

/** Share only a concise, user-reviewable summary by default. Never include
 * the submitted message, matched excerpts, phone numbers, URLs or raw evidence. */
function shareSummary(report: Report): string {
  const signals = report.signals.slice(0, 5).map((signal) => `• ${signal.title}`).join('\n');
  return [
    'TrustLens AI — safety check summary',
    `Assessment: ${report.assessment.headline}`,
    report.assessment.summary,
    signals ? `Warning signs:\n${signals}` : 'No fixed-rule warning signs were matched.',
    'This is an automated assessment, not proof of identity or a finding of fraud. Review the original message independently.',
    `Report reference: ${report.id}`,
    'https://trustlensai-u2r6.vercel.app',
  ].join('\n\n');
}

export function EvidenceReport({ id }: { id: string }) {
  const [report, setReport] = useState<Report | null | 'missing'>(null);
  const [incidentAt, setIncidentAt] = useState('');
  const [acted, setActed] = useState('');
  const [redact, setRedact] = useState<Redactions>({ preview: false, evidence: false });
  const [shareStatus, setShareStatus] = useState('');

  useEffect(() => {
    let cancelled = false;
    void getLocalReport(id).then((row) => {
      if (!cancelled) setReport(row ? row.report : 'missing');
    });
    return () => { cancelled = true; };
  }, [id]);

  if (report === null) return <div className="skeleton" style={{ height: 280 }} />;

  if (report === 'missing') {
    return (
      <div className="empty">
        <span className="empty-icon"><Lens /></span>
        <p className="empty-title">That report is not on this device</p>
        <p className="empty-note">An evidence summary is built from a report stored in this browser.</p>
        <Link href="/check" className="btn btn-primary btn-sm">Run a check <Arrow /></Link>
      </div>
    );
  }

  const generatedAt = new Date().toISOString();

  return (
    <>
      {/* Controls — excluded from the printed page. */}
      <section className="card card-pad no-print ev-controls">
        <h2>Prepare the summary</h2>
        <p className="lede" style={{ fontSize: '.92rem' }}>
          Fill in what you know, hide anything you would rather not share, then print or save as
          PDF. Everything here happens on your device.
        </p>

        <div className="grid grid-2" style={{ marginTop: 'var(--s4)' }}>
          <label className="stack" style={{ gap: 6 }}>
            <span className="label">When did it happen?</span>
            <input
              type="datetime-local"
              className="field"
              value={incidentAt}
              onChange={(e) => setIncidentAt(e.target.value)}
            />
          </label>
          <label className="stack" style={{ gap: 6 }}>
            <span className="label">What did you already do?</span>
            <input
              className="field"
              placeholder="e.g. I shared the OTP, then called my bank"
              value={acted}
              maxLength={300}
              onChange={(e) => setActed(e.target.value)}
            />
          </label>
        </div>

        <div className="stack" style={{ gap: 10, marginTop: 'var(--s4)' }}>
          <span className="label">Hide before printing</span>
          <label className="switch">
            <input type="checkbox" checked={redact.preview} onChange={(e) => setRedact((r) => ({ ...r, preview: e.target.checked }))} />
            <span className="switch-track" aria-hidden="true"><span className="switch-dot" /></span>
            <span><strong>The message text</strong><span className="switch-note">Keeps the findings, removes the quoted message.</span></span>
          </label>
          <label className="switch">
            <input type="checkbox" checked={redact.evidence} onChange={(e) => setRedact((r) => ({ ...r, evidence: e.target.checked }))} />
            <span className="switch-track" aria-hidden="true"><span className="switch-dot" /></span>
            <span><strong>Technical evidence</strong><span className="switch-note">Removes DNS, link and page observations.</span></span>
          </label>
        </div>

        <div className="check-actions" style={{ marginTop: 'var(--s5)' }}>
          <button type="button" className="btn btn-primary btn-lg" onClick={() => window.print()}>
            <Download /> Print or save as PDF
          </button>
          <span className="muted-xs">Choose &ldquo;Save as PDF&rdquo; in the print dialog.</span>
        </div>
        <div className="stack" style={{ gap: 9, marginTop: 'var(--s4)' }}>
          <span className="label">Share a reviewable summary</span>
          <p className="muted-xs">Only the assessment, short warning-sign titles and report reference are included. Your original message and technical evidence stay private unless you add them yourself.</p>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
              const content = shareSummary(report);
              if (navigator.share) {
                void navigator.share({ title: 'TrustLens AI safety summary', text: content })
                  .then(() => setShareStatus('Share sheet opened. Choose a recipient only after reviewing the summary.'))
                  .catch(() => setShareStatus('Sharing was cancelled or is unavailable. Your report remains on this device.'));
                return;
              }
              if (!navigator.clipboard?.writeText) {
                setShareStatus('System sharing and clipboard are unavailable. Choose WhatsApp, Telegram, Email or SMS below.');
                return;
              }
              void navigator.clipboard.writeText(content)
                .then(() => setShareStatus('Summary copied. Review it before sending.'))
                .catch(() => setShareStatus('Could not copy the summary. Choose an app below.'));
            }}>Share</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
              if (!navigator.clipboard?.writeText) {
                setShareStatus('Clipboard access is unavailable in this browser. Choose an app below.');
                return;
              }
              void navigator.clipboard.writeText(shareSummary(report))
                .then(() => setShareStatus('Summary copied. Review it before sending.'))
                .catch(() => setShareStatus('Copy is unavailable in this browser. Use Share or choose an app below.'));
            }}>Copy summary</button>
            <a className="btn btn-secondary btn-sm" href={`https://wa.me/?text=${encodeURIComponent(shareSummary(report))}`} target="_blank" rel="noreferrer">WhatsApp</a>
            <a className="btn btn-secondary btn-sm" href={`https://t.me/share/url?url=${encodeURIComponent('https://trustlensai-u2r6.vercel.app')}&text=${encodeURIComponent(shareSummary(report))}`} target="_blank" rel="noreferrer">Telegram</a>
            <a className="btn btn-secondary btn-sm" href={`mailto:?subject=${encodeURIComponent('TrustLens AI safety check summary')}&body=${encodeURIComponent(shareSummary(report))}`}>Email</a>
            <a className="btn btn-secondary btn-sm" href={`sms:?body=${encodeURIComponent(shareSummary(report))}`}>SMS</a>
          </div>
          {shareStatus && <p className="muted-xs" role="status" aria-live="polite">{shareStatus}</p>}
        </div>
      </section>

      {/* The document itself. */}
      <article className="ev-doc">
        <header className="ev-head">
          <div className="ev-brand">
            <span className="ev-mark" aria-hidden="true"><Shield /></span>
            <div>
              <p className="ev-brand-name">TrustLens AI</p>
              <p className="ev-brand-sub">Incident evidence summary</p>
            </div>
          </div>
          <dl className="ev-meta">
            <div><dt>Reference</dt><dd>{report.id}</dd></div>
            <div><dt>Prepared</dt><dd>{when(generatedAt)}</dd></div>
            {incidentAt && <div><dt>Incident</dt><dd>{when(new Date(incidentAt).toISOString())}</dd></div>}
          </dl>
        </header>

        {/* The disclaimer is near the top, where it cannot be missed. */}
        <p className="ev-disclaimer">
          <strong>This is not an official document.</strong> It is a summary generated by TrustLens
          AI from an automated analysis. It is not a police report, a government certificate, a
          bank acknowledgement, or a finding that any criminal offence occurred. No complaint has
          been filed by producing it. To report financial cyber fraud in India, call 1930 and file
          at cybercrime.gov.in.
        </p>

        <section className="ev-section">
          <h2>1 · Assessment</h2>
          <table className="ev-table">
            <tbody>
              <tr><th>Outcome</th><td>{report.assessment.headline}</td></tr>
              <tr><th>Category</th><td>{report.inputContext.replace(/_/g, ' ')}</td></tr>
              <tr><th>Basis</th><td>{report.assessment.summary}</td></tr>
              <tr><th>Analysed</th><td>{when(report.createdAt)}</td></tr>
              {acted && <tr><th>Action taken</th><td>{acted}</td></tr>}
            </tbody>
          </table>
        </section>

        {!redact.preview && (
          <section className="ev-section">
            <h2>2 · Message as submitted</h2>
            <pre className="ev-pre">{report.inputPreview}</pre>
          </section>
        )}

        <section className="ev-section">
          <h2>{redact.preview ? '2' : '3'} · Warning signs identified</h2>
          {report.signals.length === 0 ? (
            <p className="ev-note">No rule matched this text. That is not a finding that it is genuine.</p>
          ) : (
            <ol className="ev-list">
              {report.signals.map((s) => (
                <li key={s.id}>
                  <p className="ev-sig-title"><span className="ev-sev">{s.severity}</span> {s.title}</p>
                  {!redact.preview && s.matches[0] && <p className="ev-quote">&ldquo;{s.matches[0].text}&rdquo;</p>}
                  <p className="ev-why">{s.explanation}</p>
                  <p className="ev-prov">Established by: fixed rule ({s.id})</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        {!redact.evidence && report.evidence.length > 0 && (
          <section className="ev-section">
            <h2>{redact.preview ? '3' : '4'} · Technical observations</h2>
            <table className="ev-table">
              <thead><tr><th>Source</th><th>Method</th><th>Observation</th><th>Status</th></tr></thead>
              <tbody>
                {report.evidence.map((e) => (
                  <tr key={e.id}>
                    <td>{e.source}</td><td>{e.method}</td><td>{e.detail}</td><td>{e.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <section className="ev-section">
          <h2>Checks performed, and not performed</h2>
          <div className="ev-cols">
            <div>
              <h3>Ran</h3>
              <ul className="ev-bullets">
                {report.uncertainty.checked.map((c, i) => <li key={i}>{c}</li>)}
                {report.uncertainty.checked.length === 0 && <li>Nothing beyond the text itself.</li>}
              </ul>
            </div>
            <div>
              <h3>Did not run</h3>
              <ul className="ev-bullets">
                {report.uncertainty.notChecked.map((c, i) => <li key={i}>{c}</li>)}
                {report.uncertainty.notChecked.length === 0 && <li>None.</li>}
              </ul>
            </div>
          </div>
          <p className="ev-note">
            Sender identity and physical origin were <strong>not</strong> established. A display
            name, phone number or sender label is not evidence of who actually sent a message.
          </p>
        </section>

        <section className="ev-section">
          <h2>Where to report this</h2>
          <table className="ev-table">
            <tbody>
              <tr><th>Cyber-financial fraud helpline</th><td>1930 — call immediately if money has moved</td></tr>
              <tr><th>National Cyber Crime Reporting Portal</th><td>https://cybercrime.gov.in</td></tr>
              <tr><th>Your bank</th><td>The number printed on your card — never a number from the message</td></tr>
            </tbody>
          </table>
        </section>

        <footer className="ev-foot">
          <p>
            Generated by TrustLens AI · Reference {report.id} · {when(generatedAt)}
            {report.model.used ? ' · included an AI interpretation layer' : ' · fixed rules and retrieved evidence only'}
          </p>
          <p>
            TrustLens AI reports patterns and evidence. It cannot certify that content is genuine
            or fraudulent and does not establish intent.
          </p>
        </footer>
      </article>

      <p className="notice no-print" style={{ marginTop: 'var(--s5)' }}>
        <Lock />
        <span>Built on this device from your saved report. Nothing is uploaded to produce it.</span>
      </p>

      <p className="notice notice-high no-print" style={{ marginTop: 'var(--s3)' }}>
        <Phone />
        <span>
          If money has already gone, do not wait to print anything — call <strong>1930</strong>{' '}
          first. <Alert style={{ display: 'none' }} />
        </span>
      </p>
    </>
  );
}
