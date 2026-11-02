'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { AppShell } from '@/components/AppShell';
import { AlertIcon, ArrowIcon, ClockIcon, InfoIcon, SearchIcon, TrashIcon } from '@/components/icons';
import { CONTEXT_LABEL } from '@/lib/analysis/context-rules';
import type { AssessmentLevel } from '@/lib/analysis/types';
import {
  clearHistory,
  getHistoryServerSnapshot,
  getHistorySnapshot,
  removeFromHistory,
  subscribeHistory,
  type HistoryEntry,
} from '@/lib/history';
import { getAuthSnapshot, getServerAuthSnapshot, subscribeAuth } from '@/lib/auth/client-store';
import { useHydrated } from '@/lib/use-hydrated';

const LEVEL_LABEL: Record<AssessmentLevel, string> = {
  high_risk: 'Strong warning signs',
  elevated_risk: 'Serious warning signs',
  some_signals: 'Some warning signs',
  no_signals_detected: 'No rules matched',
};

const LEVEL_SEVERITY: Record<AssessmentLevel, string> = {
  high_risk: 'critical',
  elevated_risk: 'high',
  some_signals: 'medium',
  no_signals_detected: 'low',
};

type SortKey = 'newest' | 'oldest' | 'risk';
const RISK_ORDER: Record<AssessmentLevel, number> = {
  high_risk: 0,
  elevated_risk: 1,
  some_signals: 2,
  no_signals_detected: 3,
};

interface HistoryResponse {
  reports?: HistoryEntry[];
  error?: string;
}

export default function HistoryPage() {
  const localEntries = useSyncExternalStore(
    subscribeHistory,
    getHistorySnapshot,
    getHistoryServerSnapshot,
  );
  const auth = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerAuthSnapshot);
  const hydrated = useHydrated();

  const [accountSnapshot, setAccountSnapshot] = useState<{ email: string | null; reports: HistoryEntry[] } | null>(null);
  const [accountFailure, setAccountFailure] = useState<{ email: string | null; message: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<'all' | AssessmentLevel>('all');
  const [sort, setSort] = useState<SortKey>('newest');

  useEffect(() => {
    if (auth.status !== 'signed-in') return;

    const controller = new AbortController();
    const signedInEmail = auth.email;

    void fetch('/api/history', {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as HistoryResponse | null;
        if (!response.ok) {
          throw new Error(data?.error ?? `Account history failed (HTTP ${response.status}).`);
        }
        setAccountSnapshot({ email: signedInEmail, reports: Array.isArray(data?.reports) ? data.reports : [] });
        setAccountFailure(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setAccountFailure({ email: signedInEmail, message: error instanceof Error ? error.message : 'Account history could not be loaded.' });
      });

    return () => controller.abort();
  }, [auth.status, auth.email]);

  // Signed-in users see their server history plus any guest-only reports that
  // were created locally on this device before they signed in.
  const entries = useMemo(() => {
    const accountEntries = auth.status === 'signed-in' && accountSnapshot?.email === auth.email
      ? accountSnapshot.reports
      : null;
    if (!accountEntries) return localEntries;
    const merged = new Map<string, HistoryEntry>();
    for (const entry of localEntries) merged.set(entry.id, entry);
    for (const entry of accountEntries) merged.set(entry.id, entry);
    return [...merged.values()];
  }, [auth.status, auth.email, accountSnapshot, localEntries]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = entries.filter((entry) => {
      if (level !== 'all' && entry.level !== level) return false;
      if (!q) return true;
      const text = `${entry.preview} ${entry.context ? CONTEXT_LABEL[entry.context] : ''} ${LEVEL_LABEL[entry.level]}`;
      return text.toLowerCase().includes(q);
    });
    return filtered.sort((a, b) => {
      if (sort === 'risk') {
        const diff = RISK_ORDER[a.level] - RISK_ORDER[b.level];
        if (diff !== 0) return diff;
      }
      const at = new Date(a.createdAt).getTime();
      const bt = new Date(b.createdAt).getTime();
      return sort === 'oldest' ? at - bt : bt - at;
    });
  }, [entries, query, level, sort]);

  async function remove(entry: HistoryEntry) {
    setDeleteError(null);
    if (!entry.persisted) {
      removeFromHistory(entry.id);
      return;
    }

    setDeletingId(entry.id);
    try {
      const response = await fetch(`/api/report/${entry.id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setDeleteError(data?.error ?? `The server refused the deletion (HTTP ${response.status}).`);
        return;
      }
      removeFromHistory(entry.id);
      setAccountSnapshot((current) => current && current.email === auth.email
        ? { ...current, reports: current.reports.filter((item) => item.id !== entry.id) }
        : current);
    } catch {
      setDeleteError('The deletion could not be sent. The report is still saved — check your connection and try again.');
    } finally {
      setDeletingId(null);
    }
  }

  const filtersActive = query.trim().length > 0 || level !== 'all';
  const accountEntries = accountSnapshot?.email === auth.email ? accountSnapshot.reports : null;
  const accountError = accountFailure?.email === auth.email ? accountFailure.message : null;
  const waitingForAccount = hydrated && auth.status === 'signed-in' && accountEntries === null;

  return (
    <AppShell>
      <section style={{ padding: 'clamp(28px, 4vw, 48px) 0 clamp(16px, 2.4vw, 24px)' }}>
        <p className="eyebrow"><span className="dot" /> Investigation history</p>
        <h1 style={{ fontSize: 'clamp(28px, 3.6vw, 42px)', marginTop: 14 }}>Your investigations</h1>
        <p className="lede" style={{ marginTop: 14, maxWidth: '66ch' }}>
          {auth.status === 'signed-in'
            ? 'Reports saved while signed in are loaded securely from your account. Guest reports remain available on this device only.'
            : 'Guest reports are held in this browser. Sign in with Google or a passkey to save new reports to your account and access them on another device.'}
        </p>
        <div className="toolbar" style={{ marginTop: 16 }}>
          <span className="chip chip-accent">{auth.status === 'signed-in' ? 'Account sync enabled' : 'This-device history'}</span>
          {auth.status !== 'signed-in' && <Link className="btn btn-secondary" href="/login?next=%2Fhistory">Sign in to sync</Link>}
          <Link className="btn btn-primary" href="/analyze">New investigation <ArrowIcon /></Link>
        </div>
      </section>

      {waitingForAccount && (
        <div style={{ display: 'grid', gap: 9 }}>
          <div className="skeleton" style={{ height: 70 }} />
          <div className="skeleton" style={{ height: 70 }} />
        </div>
      )}

      {accountError && (
        <div className="banner banner-error" role="alert" style={{ marginBottom: 14 }}>
          <AlertIcon /><p><strong>Could not sync account history.</strong> {accountError}</p>
        </div>
      )}

      {deleteError && (
        <div className="banner banner-error" role="alert" style={{ marginBottom: 14 }}>
          <AlertIcon /><p><strong>Could not delete.</strong> {deleteError}</p>
        </div>
      )}

      {!waitingForAccount && hydrated && entries.some((entry) => !entry.persisted) && (
        <div className="banner banner-warn" style={{ marginBottom: 14 }}>
          <InfoIcon />
          <p><strong>Some reports were not saved.</strong> These entries exist only in this browser and cannot be reopened from another device.</p>
        </div>
      )}

      {!waitingForAccount && hydrated && entries.length > 0 && (
        <>
          <div className="hist-controls">
            <div className="search-field">
              <SearchIcon />
              <input className="search-input" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search investigations…" aria-label="Search investigations" />
            </div>
            <select className="select-field" value={level} onChange={(e) => setLevel(e.target.value as 'all' | AssessmentLevel)} aria-label="Filter by risk level">
              <option value="all">All risk levels</option>
              <option value="high_risk">Strong warning signs</option>
              <option value="elevated_risk">Serious warning signs</option>
              <option value="some_signals">Some warning signs</option>
              <option value="no_signals_detected">No rules matched</option>
            </select>
            <select className="select-field" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort investigations">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="risk">Highest risk first</option>
            </select>
            <span className="hist-count" aria-live="polite">{visible.length} of {entries.length}</span>
          </div>

          {visible.length === 0 ? (
            <section className="card empty">
              <div className="empty-icon"><SearchIcon /></div>
              <h2>No investigations match those filters</h2>
              <p>Try another search term or clear the filters.</p>
              <button type="button" className="btn btn-secondary" onClick={() => { setQuery(''); setLevel('all'); }}>Clear filters</button>
            </section>
          ) : visible.map((entry) => (
            <article className="hist-item" key={entry.id}>
              <div className="hist-main">
                <strong>{entry.preview}</strong>
                <p className="hist-meta">
                  {new Date(entry.createdAt).toLocaleString()}
                  {entry.context && ` · ${CONTEXT_LABEL[entry.context]}`}
                  {entry.isDemo && ' · demo case'}
                  {!entry.persisted && ' · not saved'}
                </p>
              </div>
              <span className={`sev-badge sev-${LEVEL_SEVERITY[entry.level]}`}>{LEVEL_LABEL[entry.level]}</span>
              {entry.persisted ? <Link className="btn btn-secondary" href={`/report/${entry.id}`}>Open</Link> : <span className="chip">Unavailable</span>}
              <button type="button" className="icon-button" onClick={() => void remove(entry)} disabled={deletingId === entry.id} aria-label={`Delete investigation from ${new Date(entry.createdAt).toLocaleString()}`}>
                <TrashIcon />
              </button>
            </article>
          ))}

          <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {filtersActive && <button type="button" className="btn btn-ghost" onClick={() => { setQuery(''); setLevel('all'); }}>Clear filters</button>}
            <button type="button" className="btn btn-ghost" onClick={() => {
              if (window.confirm(`Remove all ${localEntries.length} entries from this browser's list? Account reports remain saved until deleted individually.`)) clearHistory();
            }}>Clear this browser&apos;s list</button>
          </div>
        </>
      )}

      {!waitingForAccount && hydrated && entries.length === 0 && (
        <section className="card empty">
          <div className="empty-icon"><ClockIcon /></div>
          <h2>No investigations yet</h2>
          <p>Your completed analyses will appear here. Start with a message, website, job offer or payment request.</p>
          <div className="hero-actions" style={{ justifyContent: 'center', marginTop: 24 }}>
            <Link className="btn btn-primary" href="/analyze">Start an investigation <ArrowIcon /></Link>
          </div>
        </section>
      )}
    </AppShell>
  );
}
