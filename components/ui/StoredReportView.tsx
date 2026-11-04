'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getLocalReport, type StoredReport } from '@/lib/offline/local-reports';
import { LANGS, LANG_LABEL, LANG_NOTE, type Lang } from '@/lib/i18n/strings';
import { ReportView } from './ReportView';
import { Arrow, Download, Lens } from './icons';

type State = { phase: 'loading' } | { phase: 'found'; row: StoredReport } | { phase: 'missing' };

/**
 * Opens a saved report from this device.
 *
 * Reads IndexedDB rather than the server, so a report opens with no network
 * and with no account. A report saved on another device is genuinely not here
 * — the empty state says so rather than implying it was lost.
 */
export function StoredReportView({ id }: { id: string }) {
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    let cancelled = false;
    void getLocalReport(id).then((row) => {
      if (cancelled) return;
      setState(row ? { phase: 'found', row } : { phase: 'missing' });
    });
    return () => { cancelled = true; };
  }, [id]);

  if (state.phase === 'loading') {
    return (
      <div className="stack" style={{ gap: 12 }}>
        <div className="skeleton" style={{ height: 110 }} />
        <div className="skeleton" style={{ height: 68 }} />
        <div className="skeleton" style={{ height: 68 }} />
      </div>
    );
  }

  if (state.phase === 'missing') {
    return (
      <div className="empty">
        <span className="empty-icon"><Lens /></span>
        <p className="empty-title">That report is not on this device</p>
        <p className="empty-note">
          Reports are stored in the browser that ran the check. If you ran it on your phone, it
          will be there rather than here — this is not a sign that it was deleted.
        </p>
        <Link href="/check" className="btn btn-primary btn-sm">Run a new check <Arrow /></Link>
      </div>
    );
  }

  return (
    <>
      <div className="lang-pick" style={{ marginBottom: 'var(--s5)' }}>
        <span className="label">Explain in</span>
        <div className="seg">
          {LANGS.map((l) => (
            <button key={l} type="button" className={`seg-btn${lang === l ? ' seg-on' : ''}`} aria-pressed={lang === l} onClick={() => setLang(l)}>
              {LANG_LABEL[l]}
            </button>
          ))}
        </div>
        <span className="muted-xs lang-note">{LANG_NOTE[lang]}</span>
      </div>
      <ReportView report={state.row.report} lang={lang} />

      <div className="check-actions" style={{ marginTop: 'var(--s6)' }}>
        <Link href={`/report/${id}/evidence`} className="btn btn-secondary btn-lg">
          <Download /> Prepare an evidence summary
        </Link>
      </div>
    </>
  );
}
