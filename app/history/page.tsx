'use client';

import Link from 'next/link';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { SiteFooter, SiteHeader } from '@/components/SiteHeader';
import { FloatingActions } from '@/components/FloatingActions';
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

/** Highest risk first when sorting by risk. */
const RISK_ORDER: Record<AssessmentLevel, number> = {
  high_risk: 0,
  elevated_risk: 1,
  some_signals: 2,
  no_signals_detected: 3,
};

export default function HistoryPage() {
  const entries = useSyncExternalStore(
    subscribeHistory,
    getHistorySnapshot,
    getHistoryServerSnapshot,
  );
  const hydrated = useHydrated();

  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [level, setLevel] = useState<'all' | AssessmentLevel>('all');
  const [sort, setSort] = useState<SortKey>('newest');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = entries.filter((e) => {
      if (level !== 'all' && e.level !== level) return false;
      if (!q) return true;
      const haystack = `${e.preview} ${e.context ? CONTEXT_LABEL[e.context] : ''} ${LEVEL_LABEL[e.level]}`;
      return haystack.toLowerCase().includes(q);
    });
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sort === 'risk') {
        const diff = RISK_ORDER[a.level] - RISK_ORDER[b.level];
        if (diff !== 0) return diff;
      }
      const at = new Date(a.createdAt).getTime();
      const bt = new Date(b.createdAt).getTime();
      return sort === 'oldest' ? at - bt : bt - at;
    });
    return sorted;
  }, [entries, query, level, sort]);

  /**
   * Deletes server-side FIRST, and only drops the local entry once the server
   * confirms. Removing it optimistically made a failed delete look like a
   * success while the report was still in the database.
   */
  async function remove(entry: HistoryEntry) {
    setDeleteError(null);
    if (!entry.persisted) {
      // Nothing was ever saved, so there is only the local index to clear.
      removeFromHistory(entry.id);
      return;
    }
    setDeletingId(entry.id);
    try {
      const response = await fetch(`/api/report/${entry.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        const message =
          data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
            ? data.error
            : `The server refused the deletion (HTTP ${response.status}).`;
        setDeleteError(`${message} The report is still saved — you can try again.`);
        return;
      }
      removeFromHistory(entry.id);
    } catch {
      setDeleteError(
        'The deletion could not be sent. The report is still saved — check your connection and try again.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filtersActive = query.trim().length > 0 || level !== 'all';

  return (
    <>
      <SiteHeader current="history" />
      <main className="shell">
        <section style={{ padding: 'clamp(28px, 4vw, 48px) 0 clamp(16px, 2.4vw, 24px)' }}>
          <p className="eyebrow">
            <span className="dot" />
            Investigation history
          </p>
          <h1 style={{ fontSize: 'clamp(28px, 3.6vw, 42px)', marginTop: 14 }}>Your past analyses</h1>
          <p className="lede" style={{ marginTop: 14, maxWidth: '64ch' }}>
            This list is held in this browser only. The server has no endpoint that lists reports,
            which is what makes it impossible to reach anyone else&apos;s history from here.
          </p>
        </section>

        {!hydrated ? (
          <div style={{ display: 'grid', gap: 9 }}>
            <div className="skeleton" style={{ height: 70 }} />
            <div className="skeleton" style={{ height: 70 }} />
          </div>
        ) : entries.length === 0 ? (
          <section className="card empty">
            <div className="empty-icon"><ClockIcon /></div>
            <h2>Nothing analysed yet</h2>
            <p>
              Reports you run will be listed here. Clearing your browser data, or using a private
              window, will empty this list.
            </p>
            <div className="hero-actions" style={{ justifyContent: 'center', marginTop: 24 }}>
              <Link className="btn btn-primary" href="/analyze">
                Analyze something <ArrowIcon />
              </Link>
            </div>
          </section>
        ) : (
          <>
            <div className="hist-controls">
              <div className="search-field">
                <SearchIcon />
                <input
                  className="search-input"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your analyses…"
                  aria-label="Search your analyses"
                />
              </div>
              <select
                className="select-field"
                value={level}
                onChange={(e) => setLevel(e.target.value as 'all' | AssessmentLevel)}
                aria-label="Filter by risk level"
              >
                <option value="all">All risk levels</option>
                <option value="high_risk">Strong warning signs</option>
                <option value="elevated_risk">Serious warning signs</option>
                <option value="some_signals">Some warning signs</option>
                <option value="no_signals_detected">No rules matched</option>
              </select>
              <select
                className="select-field"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                aria-label="Sort analyses"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="risk">Highest risk first</option>
              </select>
              <span className="hist-count" aria-live="polite">
                {visible.length} of {entries.length}
              </span>
            </div>

            {deleteError && (
              <div className="banner banner-error" style={{ marginBottom: 14 }} role="alert">
                <AlertIcon />
                <p>
                  <strong>Could not delete.</strong> <span className="banner-body">{deleteError}</span>
                </p>
              </div>
            )}

            {entries.some((e) => !e.persisted) && (
              <div className="banner banner-warn" style={{ marginBottom: 14 }}>
                <InfoIcon />
                <p>
                  <strong>Some reports were not saved.</strong>{' '}
                  <span className="banner-body">
                    Entries marked &ldquo;not saved&rdquo; exist only as this local record and
                    cannot be reopened, because report storage was unavailable when they ran.
                  </span>
                </p>
              </div>
            )}

            {visible.length === 0 ? (
              <section className="card empty">
                <div className="empty-icon"><SearchIcon /></div>
                <h2>No analyses match those filters</h2>
                <p>Try a different search term, or clear the filters to see everything again.</p>
                <div className="hero-actions" style={{ justifyContent: 'center', marginTop: 24 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setQuery('');
                      setLevel('all');
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              </section>
            ) : (
              visible.map((entry) => (
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
                  <span className={`sev-badge sev-${LEVEL_SEVERITY[entry.level]}`}>
                    {LEVEL_LABEL[entry.level]}
                  </span>
                  {entry.persisted ? (
                    <Link className="btn btn-secondary" href={`/report/${entry.id}`}>
                      Open
                    </Link>
                  ) : (
                    <span className="chip">Unavailable</span>
                  )}
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => void remove(entry)}
                    disabled={deletingId === entry.id}
                    aria-label={`Delete the analysis from ${new Date(entry.createdAt).toLocaleString()}`}
                  >
                    <TrashIcon />
                  </button>
                </article>
              ))
            )}

            <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {filtersActive && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setQuery('');
                    setLevel('all');
                  }}
                >
                  Clear filters
                </button>
              )}
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  if (
                    window.confirm(
                      `Remove all ${entries.length} entries from this browser's list? Saved reports stay on the server unless you delete them individually.`,
                    )
                  ) {
                    clearHistory();
                  }
                }}
              >
                Clear this browser&apos;s list
              </button>
            </div>
          </>
        )}

        <SiteFooter />
      </main>

      <FloatingActions
        actions={[
          { id: 'new', label: 'New analysis', icon: 'new', href: '/analyze' },
          { id: 'examples', label: 'Example cases', icon: 'analyze', href: '/analyze' },
        ]}
      />
    </>
  );
}
