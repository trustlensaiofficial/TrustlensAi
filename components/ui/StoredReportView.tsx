'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getLocalReport, type StoredReport } from '@/lib/offline/local-reports';
import { useLocale } from '@/components/i18n/LocaleProvider';
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
  // The stored report is explained in the interface language, like every
  // other surface. It used to carry its own picker.
  const { locale: lang } = useLocale();

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
      <ReportView report={state.row.report} lang={lang} />

      <div className="check-actions" style={{ marginTop: 'var(--s6)' }}>
        <Link href={`/report/${id}/evidence`} className="btn btn-secondary btn-lg">
          <Download /> Prepare an evidence summary
        </Link>
      </div>
    </>
  );
}
