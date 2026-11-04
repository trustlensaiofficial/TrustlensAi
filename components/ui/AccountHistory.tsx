'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { deleteLocalReport } from '@/lib/offline/local-reports';
import { Arrow, Clock, Lock, Trash } from './icons';

interface AccountReport {
  id: string;
  preview: string;
  kind: 'message' | 'url' | 'claim';
  level: 'high_risk' | 'elevated_risk' | 'some_signals' | 'no_signals_detected';
  createdAt: string;
  isDemo: boolean;
  persisted: true;
  context?: string;
}

const LABEL: Record<AccountReport['level'], string> = {
  high_risk: 'Strong warning signs',
  elevated_risk: 'Needs verification',
  some_signals: 'A few things to check',
  no_signals_detected: 'No strong signs found',
};

const CHIP: Record<AccountReport['level'], string> = {
  high_risk: 'chip-high',
  elevated_risk: 'chip-check',
  some_signals: 'chip-check',
  no_signals_detected: 'chip-clear',
};

export function AccountHistory() {
  const [rows, setRows] = useState<AccountReport[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const response = await fetch('/api/account/history', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) {
        setRows([]);
        setError(typeof data?.error === 'string' ? data.error : 'Account history could not be loaded.');
        return;
      }
      setRows(Array.isArray(data?.reports) ? data.reports as AccountReport[] : []);
      setNotice(typeof data?.notice === 'string' ? data.notice : null);
      setError(null);
    } catch {
      setRows([]);
      setError('Account history could not be reached. Your device-only reports are not affected.');
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const remove = useCallback(async (id: string) => {
    setDeleting(id);
    setError(null);
    try {
      const response = await fetch(`/api/report/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        setError(typeof data?.error === 'string' ? data.error : 'The account copy could not be deleted.');
        return;
      }
      await deleteLocalReport(id);
      setRows((current) => current?.filter((row) => row.id !== id) ?? []);
    } catch {
      setError('The account copy could not be deleted. It remains listed so you can retry.');
    } finally {
      setDeleting(null);
    }
  }, []);

  if (rows === null) {
    return <div className="stack" style={{ gap: 8 }}><div className="skeleton" style={{ height: 64 }} /><div className="skeleton" style={{ height: 64 }} /></div>;
  }

  return (
    <div>
      {error && <p className="notice notice-high" role="alert">{error}</p>}
      {notice && <p className="notice notice-check" role="status">{notice}</p>}
      {rows.length === 0 ? (
        <div className="empty">
          <span className="empty-icon"><Lock /></span>
          <p className="empty-title">No account-synced reports</p>
          <p className="empty-note">Your normal checks stay in this browser. Turn on account sync only when you want a report available from your signed-in account.</p>
        </div>
      ) : (
        <ul className="recent">
          {rows.map((row) => (
            <li key={row.id} className="activity-row">
              <Link href={`/report/${row.id}`} className="recent-row grow">
                <span className={`chip ${CHIP[row.level]}`}>{LABEL[row.level]}</span>
                <span className="recent-preview">{row.preview}</span>
                <span className="recent-when"><Clock /> {new Date(row.createdAt).toLocaleString()}</span>
              </Link>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-label={`Delete account copy ${row.preview}`}
                disabled={deleting === row.id}
                onClick={() => void remove(row.id)}
              >
                <Trash /> {deleting === row.id ? 'Deleting…' : 'Delete'}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="muted-xs" style={{ marginTop: 'var(--s3)' }}>
        <Lock style={{ width: 13, height: 13, verticalAlign: '-2px' }} /> These rows are fetched with your signed-in account and are not exposed to other users.
      </p>
    </div>
  );
}
