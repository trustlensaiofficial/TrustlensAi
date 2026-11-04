'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listLocalReports, type StoredReport } from '@/lib/offline/local-reports';
import { Arrow, Clock, Lens } from './icons';

const LEVEL_CHIP = {
  high_risk: 'chip-high',
  elevated_risk: 'chip-check',
  some_signals: 'chip-check',
  no_signals_detected: 'chip-clear',
} as const;

const LEVEL_WORD = {
  high_risk: 'Strong warning signs',
  elevated_risk: 'Needs verification',
  some_signals: 'A few things to check',
  no_signals_detected: 'No strong signs',
} as const;

/**
 * Recent checks from this device.
 *
 * Reads IndexedDB, which is browser-only, so the list starts empty and fills
 * in after mount. `null` means "not read yet" and is rendered as a skeleton —
 * distinguishing it from "read, and there is nothing", which is a real empty
 * state with different copy.
 */
export function RecentActivity({ limit = 4 }: { limit?: number }) {
  const [rows, setRows] = useState<StoredReport[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listLocalReports().then((all) => {
      if (!cancelled) setRows(all.slice(0, limit));
    });
    return () => { cancelled = true; };
  }, [limit]);

  if (rows === null) {
    return (
      <div className="stack" style={{ gap: 8 }}>
        <div className="skeleton" style={{ height: 58 }} />
        <div className="skeleton" style={{ height: 58 }} />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="empty">
        <span className="empty-icon"><Lens /></span>
        <p className="empty-title">Nothing checked yet</p>
        <p className="empty-note">Checks you run are kept on this device, so they work offline and need no account.</p>
        <Link href="/check" className="btn btn-primary btn-sm">Check something <Arrow /></Link>
      </div>
    );
  }

  return (
    <ul className="recent">
      {rows.map((r) => (
        <li key={r.id}>
          <Link href={`/report/${r.id}`} className="recent-row">
            <span className={`chip ${LEVEL_CHIP[r.level]}`}>{LEVEL_WORD[r.level]}</span>
            <span className="recent-preview">{r.preview}</span>
            <span className="recent-when"><Clock /> {new Date(r.createdAt).toLocaleDateString()}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
