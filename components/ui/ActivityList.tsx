'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { clearLocalReports, deleteLocalReport, listLocalReports, type StoredReport } from '@/lib/offline/local-reports';
import { Arrow, Clock, Lens, Lock, Trash } from './icons';
import { useT } from '@/components/i18n/LocaleProvider';
import type { DictKey } from '@/lib/i18n';

const CHIP = {
  high_risk: 'chip-high',
  elevated_risk: 'chip-check',
  some_signals: 'chip-check',
  no_signals_detected: 'chip-clear',
} as const;

/* The verdict words come from the dictionary now, so a list of past checks
   reads in the same language as the reports it links to. */

export function ActivityList() {
  const t = useT();
  const [rows, setRows] = useState<StoredReport[] | null>(null);

  const reload = useCallback(() => {
    void listLocalReports().then(setRows);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const remove = useCallback(async (id: string) => {
    await deleteLocalReport(id);
    reload();
  }, [reload]);

  const clearAll = useCallback(async () => {
    await clearLocalReports();
    reload();
  }, [reload]);

  if (rows === null) {
    return <div className="stack" style={{ gap: 8 }}><div className="skeleton" style={{ height: 64 }} /><div className="skeleton" style={{ height: 64 }} /></div>;
  }

  if (rows.length === 0) {
    return (
      <div className="empty">
        <span className="empty-icon"><Lens /></span>
        <p className="empty-title">{t('activity.emptyTitleFull')}</p>
        <p className="empty-note">{t('activity.emptyNoteFull')}</p>
        <Link href="/check" className="btn btn-primary btn-sm">Check something <Arrow /></Link>
      </div>
    );
  }

  return (
    <>
      <ul className="recent">
        {rows.map((r) => (
          <li key={r.id} className="activity-row">
            <Link href={`/report/${r.id}`} className="recent-row grow">
              <span className={`chip ${CHIP[r.level]}`}>{t(`verdict.${r.level}` as DictKey)}</span>
              <span className="recent-preview">{r.preview}</span>
              <span className="recent-when"><Clock /> {new Date(r.createdAt).toLocaleString()}</span>
            </Link>
            <button type="button" className="btn btn-ghost btn-sm" aria-label={t('activity.delete')} onClick={() => void remove(r.id)}>
              <Trash />
            </button>
          </li>
        ))}
      </ul>

      <div className="row" style={{ gap: 'var(--s3)', marginTop: 'var(--s5)', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-danger btn-sm" onClick={() => void clearAll()}>
          <Trash /> {t('activity.deleteAll').replace('{n}', String(rows.length))}
        </button>
        <span className="muted-xs"><Lock style={{ width: 13, height: 13, verticalAlign: '-2px' }} /> {t('activity.deleteNote')}</span>
      </div>
    </>
  );
}
