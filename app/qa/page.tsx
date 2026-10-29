'use client';

import { useCallback, useMemo, useState } from 'react';
import { SiteFooter, SiteHeader } from '@/components/SiteHeader';
import { CHECKS, GROUPS, clearAnalysisCache, type CheckResult, type Status } from '@/lib/qa/checks';
import { AlertIcon, CheckIcon, CloseIcon, InfoIcon, LensIcon, ShieldIcon } from '@/components/icons';

const LABEL: Record<Status, string> = {
  pass: 'Passed',
  fail: 'Failed',
  blocked: 'Blocked',
  notrun: 'Not run',
  running: 'Running',
};

function StatusPill({ status }: { status: Status }) {
  const icon =
    status === 'pass' ? <CheckIcon /> :
    status === 'fail' ? <CloseIcon /> :
    status === 'blocked' ? <AlertIcon /> :
    status === 'running' ? <LensIcon className="spin" /> : <InfoIcon />;
  return (
    <span className={`qa-pill qa-${status}`}>
      {icon}
      {LABEL[status]}
    </span>
  );
}

/**
 * Feature testing panel.
 *
 * Every row either runs a real check against the live application or states
 * why it cannot. Nothing is marked passed because a configuration value is
 * present — an environment variable proves a key exists, never that a call
 * to the provider succeeds. External flows that genuinely need a human, a
 * device prompt or a dashboard setting are reported as Blocked with the
 * precise next step, which is more useful than a green tick that is wrong.
 */
export default function QaPage() {
  const [results, setResults] = useState<Record<string, CheckResult>>({});
  const [busy, setBusy] = useState(false);

  const runOne = useCallback(async (id: string) => {
    const check = CHECKS.find((c) => c.id === id);
    if (!check) return;
    setResults((r) => ({ ...r, [id]: { status: 'running', detail: '…' } }));
    try {
      const result = await check.run();
      setResults((r) => ({ ...r, [id]: result }));
    } catch (err) {
      setResults((r) => ({
        ...r,
        [id]: { status: 'fail', detail: err instanceof Error ? err.message.slice(0, 160) : 'Threw an error' },
      }));
    }
  }, []);

  const runAll = useCallback(async () => {
    setBusy(true);
    // A fresh run must re-exercise the API rather than read last run's answers.
    clearAnalysisCache();
    // Sequential on purpose: several checks call the analysis API, and firing
    // them together would trip the rate limiter and report false failures.
    for (const check of CHECKS) {
      await runOne(check.id);
    }
    setBusy(false);
  }, [runOne]);

  const tally = useMemo(() => {
    const counts: Record<Status, number> = { pass: 0, fail: 0, blocked: 0, notrun: 0, running: 0 };
    for (const check of CHECKS) {
      counts[results[check.id]?.status ?? 'notrun'] += 1;
    }
    return counts;
  }, [results]);

  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section style={{ padding: 'clamp(28px, 4vw, 48px) 0 clamp(16px, 2.4vw, 24px)' }}>
          <p className="eyebrow"><span className="dot" /> Feature testing</p>
          <h1 style={{ fontSize: 'clamp(28px, 3.6vw, 42px)', marginTop: 14 }}>
            Does this actually work?
          </h1>
          <p className="lede" style={{ marginTop: 14, maxWidth: '66ch' }}>
            {CHECKS.length} checks that run against this running application. Nothing here passes
            because a setting exists — an environment variable proves a key is present, never that
            a call succeeds. Anything needing a human, a device prompt or a dashboard change is
            reported as <strong>Blocked</strong> with the exact next step.
          </p>
        </section>

        <div className="qa-bar">
          <button type="button" className="btn btn-primary" onClick={() => void runAll()} disabled={busy}>
            {busy ? 'Running…' : `Run all ${CHECKS.length} checks`}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => { clearAnalysisCache(); setResults({}); }}
            disabled={busy}
          >
            Reset
          </button>
          <div className="qa-tally">
            <span className="qa-pill qa-pass"><CheckIcon />{tally.pass}</span>
            <span className="qa-pill qa-fail"><CloseIcon />{tally.fail}</span>
            <span className="qa-pill qa-blocked"><AlertIcon />{tally.blocked}</span>
            <span className="qa-pill qa-notrun"><InfoIcon />{tally.notrun}</span>
          </div>
        </div>

        <div className="banner" style={{ marginTop: 16 }}>
          <ShieldIcon />
          <p>
            <span className="banner-body">
              These checks read statuses and counts only — no token, session, analysed text or
              report body is displayed. A full run spends 11 of the API&apos;s 12 analyses per
              minute and creates one test report, which it then deletes. Running twice inside a
              minute will report the limiter as Blocked; that is the limiter working.
            </span>
          </p>
        </div>

        {GROUPS.map((group) => (
          <section className="section" key={group} aria-labelledby={`qa-${group}`}>
            <div className="section-head">
              <h2 id={`qa-${group}`} style={{ fontSize: 18 }}>{group}</h2>
              <p>{CHECKS.filter((c) => c.group === group).length} checks</p>
            </div>
            {CHECKS.filter((c) => c.group === group).map((check) => {
              const result = results[check.id] ?? { status: 'notrun' as Status, detail: 'Not run yet.' };
              return (
                <article className="qa-row" key={check.id} data-status={result.status}>
                  <div className="qa-main">
                    <div className="qa-title">
                      <StatusPill status={result.status} />
                      <strong>{check.title}</strong>
                    </div>
                    <p className="qa-proves">{check.proves}</p>
                    <p className="qa-detail">{result.detail}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm qa-run"
                    onClick={() => void runOne(check.id)}
                    disabled={busy || result.status === 'running'}
                  >
                    Run
                  </button>
                </article>
              );
            })}
          </section>
        ))}

        <p style={{ marginTop: 26, color: 'var(--text-faint)', fontSize: 12.5, lineHeight: 1.6 }}>
          <strong>Passed</strong> — executed and met its assertion. <strong>Failed</strong> —
          executed and did not. <strong>Blocked</strong> — cannot be verified from here; the reason
          names what is needed. <strong>Not run</strong> — not executed yet. A blocked check is not
          a passing one.
        </p>

        <SiteFooter />
      </main>
    </>
  );
}
