'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { SiteFooter, SiteHeader } from '@/components/SiteHeader';
import { ArrowIcon, ClockIcon, InfoIcon, TrashIcon } from '@/components/icons';
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

const KIND_LABEL = { message: 'Message', url: 'Link', claim: 'Claim' } as const;

export default function HistoryPage() {
  // localStorage is external state, so it is read through useSyncExternalStore
  // rather than an effect. The store re-emits on every mutation and on a
  // storage event from another tab, so this list stays current by itself.
  const entries = useSyncExternalStore(
    subscribeHistory,
    getHistorySnapshot,
    getHistoryServerSnapshot,
  );
  const hydrated = useHydrated();

  async function remove(entry: HistoryEntry) {
    removeFromHistory(entry.id);
    // Also delete the stored copy, so "remove" is not merely cosmetic.
    if (entry.persisted) {
      try {
        await fetch(`/api/report/${entry.id}`, { method: 'DELETE' });
      } catch {
        /* the local index is already updated; the row may remain */
      }
    }
  }

  return (
    <>
      <SiteHeader current="history" />
      <main className="shell">
        <section style={{ padding: 'clamp(28px, 4vw, 48px) 0 clamp(16px, 2.4vw, 24px)' }}>
          <p className="eyebrow">
            <span className="dot" />
            Scan history
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

            {entries.map((entry) => (
              <article className="hist-item" key={entry.id}>
                <div className="hist-main">
                  <strong>{entry.preview}</strong>
                  <p className="hist-meta">
                    {new Date(entry.createdAt).toLocaleString()} · {KIND_LABEL[entry.kind]}
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
                  aria-label={`Remove this report from history`}
                >
                  <TrashIcon />
                </button>
              </article>
            ))}

            <div style={{ marginTop: 18 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => clearHistory()}
              >
                Clear this browser&apos;s list
              </button>
            </div>
          </>
        )}

        <SiteFooter />
      </main>
    </>
  );
}
