'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TOUR, TOUR_SCENARIOS, type TourPanel, type TourScenario } from '@/lib/showcase/tour';
import { CONTEXT_LABEL } from '@/lib/analysis/context-rules';
import type { Report } from '@/lib/analysis/types';
import { ChecklistPanel } from '../ChecklistPanel';
import { ReportView } from '../ReportView';
import {
  AlertIcon, ArrowIcon, CheckIcon, ChevronRightIcon, ClockIcon,
  EvidenceIcon, InfoIcon, LensIcon, ScalesIcon, ShieldIcon,
} from '../icons';

/** The stages the real pipeline runs, in order. Used by feature 03. */
const STAGES = [
  { label: 'Understand the submitted content', detail: 'Validate, classify, pick the context rule set' },
  { label: 'Identify relevant signals', detail: 'Deterministic warning-sign rules' },
  { label: 'Examine available evidence', detail: 'Link structure offline, then DNS and page metadata' },
  { label: 'Separate observation from interpretation', detail: 'Provenance assigned to every finding' },
  { label: 'Prepare practical next steps', detail: 'Checklist built from the signals that fired' },
];

interface RunState {
  status: 'idle' | 'running' | 'done' | 'error';
  stage: number;
  error?: string;
}

export function FeatureTour({ onRestart, onHome }: { onRestart: () => void; onHome: () => void }) {
  const [index, setIndex] = useState(0);
  const [visited, setVisited] = useState<Set<TourPanel>>(() => new Set<TourPanel>(['overview']));
  const [scenario, setScenario] = useState<TourScenario | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [storageNote, setStorageNote] = useState<string | undefined>();
  const [run, setRun] = useState<RunState>({ status: 'idle', stage: -1 });
  const [openFlow, setOpenFlow] = useState<string | null>(null);
  const [openFinding, setOpenFinding] = useState<string | null>(null);
  const [ranReports, setRanReports] = useState<Array<{ id: string; label: string; level: string }>>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const feature = TOUR[index]!;

  const go = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(TOUR.length - 1, next));
    setIndex(clamped);
    const id = TOUR[clamped]!.id;
    setVisited((v) => new Set(v).add(id));
    panelRef.current?.focus({ preventScroll: true });
  }, []);

  // Keyboard navigation across the whole tour.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.key === 'ArrowRight') go(index + 1);
      if (e.key === 'ArrowLeft') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, go]);

  useEffect(() => () => { if (stageTimer.current) clearInterval(stageTimer.current); }, []);

  /**
   * Runs the REAL analysis endpoint for the chosen scenario.
   *
   * The stage list advances on a timer purely as a readable description of the
   * work; it is labelled as such and never claims a network check happened.
   * What actually ran is reported afterwards from the returned report's own
   * completeness record.
   */
  const runAnalysis = useCallback(async (target: TourScenario) => {
    if (stageTimer.current) clearInterval(stageTimer.current);
    setRun({ status: 'running', stage: 0 });
    setReport(null);
    setOpenFinding(null);

    stageTimer.current = setInterval(() => {
      setRun((r) => (r.status === 'running' && r.stage < STAGES.length - 1
        ? { ...r, stage: r.stage + 1 } : r));
    }, 520);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoSlug: target.slug, liveChecks: true }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (stageTimer.current) clearInterval(stageTimer.current);
      if (!res.ok) {
        const msg = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
          ? data.error : `The analysis failed (HTTP ${res.status}).`;
        setRun({ status: 'error', stage: -1, error: msg });
        return;
      }
      const result = data as { report: Report; storageNote?: string };
      setReport(result.report);
      setStorageNote(result.storageNote);
      setRun({ status: 'done', stage: STAGES.length - 1 });
      setRanReports((prev) => [
        { id: result.report.id, label: target.label, level: result.report.assessment.level },
        ...prev.filter((p) => p.label !== target.label),
      ].slice(0, 6));
    } catch {
      if (stageTimer.current) clearInterval(stageTimer.current);
      setRun({ status: 'error', stage: -1, error: 'The request could not be sent. Check your connection and try again.' });
    }
  }, []);

  const chooseScenario = useCallback((s: TourScenario) => {
    setScenario(s);
    setReport(null);
    setRun({ status: 'idle', stage: -1 });
    void runAnalysis(s);
  }, [runAnalysis]);

  const needsReport = ['evidence', 'unknowns', 'actions', 'report'].includes(feature.id);
  const progressPct = Math.round(((index + 1) / TOUR.length) * 100);

  const EmptyNeedsScenario = useMemo(() => (
    <div className="sc-empty">
      <LensIcon style={{ width: 30, height: 30, color: 'var(--sc-faint)' }} />
      <h3 style={{ marginTop: 14 }}>Pick a scenario first</h3>
      <p>This panel shows a real report, so it needs one. Choose a case and the analysis runs for real.</p>
      <button type="button" className="sc-btn sc-btn-primary" style={{ marginTop: 20 }} onClick={() => go(1)}>
        Choose an investigation <ArrowIcon />
      </button>
    </div>
  ), [go]);

  return (
    <section className="sc-tour sc-shell" aria-labelledby="sc-tour-title">
      <div className="sc-tour-head">
        <div>
          <p className="sc-eyebrow"><i /> Guided tour</p>
          <h2 id="sc-tour-title" style={{ fontSize: 'clamp(19px, 2.4vw, 25px)', marginTop: 8 }}>
            Explore the prototype
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
          <button type="button" className="sc-btn sc-btn-ghost sc-btn-sm" onClick={onHome}>Back to intro</button>
          <Link className="sc-btn sc-btn-sm" href="/analyze">Open the real workspace</Link>
        </div>
      </div>

      <div className="sc-tour-grid">
        {/* ------------------------------------------------- navigation -- */}
        <nav className="sc-nav" aria-label="Tour features">
          {TOUR.map((f, i) => (
            <button
              key={f.id}
              type="button"
              className="sc-nav-item"
              aria-current={i === index}
              onClick={() => go(i)}
            >
              <span className="sc-nav-num">{f.number}</span>
              <span className="sc-nav-title">{f.title}</span>
              {visited.has(f.id) && i !== index && (
                <span className="sc-nav-done" aria-label="visited"><CheckIcon /></span>
              )}
            </button>
          ))}
        </nav>

        {/* ------------------------------------------------------ panel -- */}
        <div className="sc-panel" ref={panelRef} tabIndex={-1} aria-live="polite">
          <header className="sc-panel-head">
            <p className="sc-eyebrow"><i /> Feature {feature.number}</p>
            <h2 style={{ marginTop: 9 }}>{feature.title}</h2>
            <p className="sc-blurb">{feature.blurb}</p>
            <p className="sc-prompt"><ChevronRightIcon style={{ width: 14, height: 14 }} />{feature.prompt}</p>
          </header>

          {/* 01 ---------------------------------------------------------- */}
          {feature.id === 'overview' && (
            <div>
              <div className="sc-flow">
                {[
                  { k: 'input', t: 'Input', s: 'What you received', d: 'Paste a message, a link, a job offer, an invoice or a proposal. The context you pick decides which rule set runs.' },
                  { k: 'investigation', t: 'Investigation', s: 'Rules and checks', d: 'Deterministic rules read the wording. Link structure is parsed offline. Where a link exists, DNS and page metadata are checked — with private and internal addresses refused.' },
                  { k: 'evidence', t: 'Evidence', s: 'What was found', d: 'Every finding carries the exact text that triggered it, so you can judge the reasoning rather than trust a score.' },
                  { k: 'uncertainty', t: 'Uncertainty', s: 'What is unknown', d: 'Checks that failed or never ran are shown as prominently as those that succeeded. Absence of a warning is never treated as proof of safety.' },
                  { k: 'action', t: 'Next action', s: 'What to do', d: 'Findings become concrete steps you can take through a channel you already control. This is the part most tools leave out.' },
                ].map((n) => (
                  <button
                    key={n.k}
                    type="button"
                    className="sc-flow-node"
                    aria-pressed={openFlow === n.k}
                    onClick={() => setOpenFlow(openFlow === n.k ? null : n.k)}
                  >
                    <strong>{n.t}</strong>
                    <span>{n.s}</span>
                  </button>
                ))}
              </div>
              {openFlow && (
                <p className="sc-flow-detail">
                  {[
                    { k: 'input', d: 'Paste a message, a link, a job offer, an invoice or a proposal. The context you pick decides which rule set runs.' },
                    { k: 'investigation', d: 'Deterministic rules read the wording. Link structure is parsed offline. Where a link exists, DNS and page metadata are checked — with private and internal addresses refused.' },
                    { k: 'evidence', d: 'Every finding carries the exact text that triggered it, so you can judge the reasoning rather than trust a score.' },
                    { k: 'uncertainty', d: 'Checks that failed or never ran are shown as prominently as those that succeeded. Absence of a warning is never treated as proof of safety.' },
                    { k: 'action', d: 'Findings become concrete steps you can take through a channel you already control. This is the part most tools leave out.' },
                  ].find((x) => x.k === openFlow)?.d}
                </p>
              )}
              <div style={{ marginTop: 22 }}>
                <button type="button" className="sc-btn sc-btn-primary" onClick={() => go(1)}>
                  Start a sample investigation <ArrowIcon />
                </button>
              </div>
            </div>
          )}

          {/* 02 ---------------------------------------------------------- */}
          {feature.id === 'choose' && (
            <div>
              <div className="sc-scenarios">
                {TOUR_SCENARIOS.map((s) => (
                  <button
                    key={s.slug}
                    type="button"
                    className="sc-scenario"
                    aria-pressed={scenario?.slug === s.slug}
                    onClick={() => chooseScenario(s)}
                  >
                    <strong>{s.label}</strong>
                    <span>{s.situation}</span>
                    <em>{CONTEXT_LABEL[s.context]}</em>
                  </button>
                ))}
              </div>
              <div className="sc-note" style={{ marginTop: 18 }}>
                <InfoIcon />
                <span>
                  These run the real <code>/api/analyze</code> endpoint — the same one the live
                  workspace uses. The sample text is written for this demonstration and names no
                  real company or person. File upload is not offered because the application does
                  not support it.
                </span>
              </div>
              {scenario && run.status === 'done' && (
                <div style={{ marginTop: 18 }}>
                  <button type="button" className="sc-btn sc-btn-primary" onClick={() => go(2)}>
                    Watch the investigation <ArrowIcon />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 03 ---------------------------------------------------------- */}
          {feature.id === 'investigate' && (
            !scenario ? EmptyNeedsScenario : (
              <div>
                <div className="sc-scan">
                  {STAGES.map((s, i) => {
                    const state = run.status === 'done' ? 'done'
                      : run.status === 'running' && i <= run.stage ? 'done'
                      : run.status === 'running' && i === run.stage + 1 ? 'active' : 'idle';
                    return (
                      <div className="sc-scan-row" key={s.label} style={{ opacity: state === 'idle' ? .45 : 1 }}>
                        <span className={state === 'done' ? 'sc-dot sc-dot-ok' : 'sc-dot'} />
                        <b>{s.label}</b>
                        <span style={{ marginLeft: 'auto', fontSize: 11.5 }}>{s.detail}</span>
                      </div>
                    );
                  })}
                </div>

                {run.status === 'error' && (
                  <div className="sc-note sc-note-warn" style={{ marginTop: 16 }}>
                    <AlertIcon /><span>{run.error}</span>
                  </div>
                )}

                {run.status === 'done' && report && (
                  <div className="sc-note" style={{ marginTop: 16 }}>
                    <CheckIcon />
                    <span>
                      Analysis complete. <b>What actually ran:</b>{' '}
                      {report.completeness.items.filter((i) => i.present).map((i) => i.label).join(', ') || 'rules only'}.
                      {report.completeness.items.some((i) => !i.present) && (
                        <> Not run: {report.completeness.items.filter((i) => !i.present).map((i) => i.label).join(', ')}.</>
                      )}
                    </span>
                  </div>
                )}

                <div className="sc-note sc-note-warn" style={{ marginTop: 12 }}>
                  <InfoIcon />
                  <span>
                    The stage list above is a readable description of the pipeline, not a live
                    progress feed — a single request does not report per-stage progress. What was
                    genuinely performed is reported from the finished report, above.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 18 }}>
                  <button type="button" className="sc-btn sc-btn-sm" onClick={() => void runAnalysis(scenario)} disabled={run.status === 'running'}>
                    {run.status === 'running' ? 'Running…' : 'Run again'}
                  </button>
                  <button type="button" className="sc-btn sc-btn-sm" onClick={() => { setReport(null); setRun({ status: 'idle', stage: -1 }); }}>
                    Reset
                  </button>
                  {report && (
                    <button type="button" className="sc-btn sc-btn-primary sc-btn-sm" onClick={() => go(3)}>
                      Explore the evidence <ArrowIcon />
                    </button>
                  )}
                </div>
              </div>
            )
          )}

          {/* 04 ---------------------------------------------------------- */}
          {feature.id === 'evidence' && (
            !report ? EmptyNeedsScenario : (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {report.signals.map((s) => {
                    const open = openFinding === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        className="sc-flow-node"
                        aria-pressed={open}
                        aria-expanded={open}
                        style={{ width: '100%' }}
                        onClick={() => setOpenFinding(open ? null : s.id)}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className={
                            s.severity === 'critical' ? 'sc-dot sc-dot-crit'
                            : s.severity === 'high' ? 'sc-dot sc-dot-warn' : 'sc-dot'
                          } />
                          <strong style={{ flex: 1 }}>{s.title}</strong>
                          <span style={{ fontSize: 10.5, letterSpacing: '.09em', textTransform: 'uppercase', opacity: .8 }}>
                            {s.severity}
                          </span>
                        </span>
                        {open && (
                          <span style={{ display: 'block', marginTop: 12, color: 'var(--sc-muted)', fontSize: 12.5, lineHeight: 1.6 }}>
                            <span style={{ display: 'block', marginBottom: 9 }}>{s.explanation}</span>
                            {s.matches.slice(0, 3).map((m, i) => (
                              <code key={i} style={{
                                display: 'inline-block', margin: '0 6px 6px 0', padding: '3px 8px',
                                borderRadius: 6, background: 'rgba(255,255,255,.07)',
                                border: '1px solid var(--sc-line)', fontSize: 11.5, color: 'var(--sc-ice-bright)',
                              }}>
                                {m.text.length > 80 ? `${m.text.slice(0, 79)}…` : m.text}
                              </code>
                            ))}
                            <span style={{ display: 'block', marginTop: 8, color: 'var(--sc-faint)', fontSize: 11.5 }}>
                              Rule match — produced by a fixed rule, no model involved. It shows this pattern
                              is present; it does not by itself establish intent.
                            </span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {report.signals.length === 0 && (
                  <p className="sc-note" style={{ marginTop: 4 }}>
                    <InfoIcon /><span>No rule matched this input — which is informative, but not proof it is genuine.</span>
                  </p>
                )}
                <div style={{ marginTop: 18 }}>
                  <button type="button" className="sc-btn sc-btn-primary" onClick={() => go(4)}>
                    What is still unknown? <ArrowIcon />
                  </button>
                </div>
              </div>
            )
          )}

          {/* 05 ---------------------------------------------------------- */}
          {feature.id === 'unknowns' && (
            !report ? EmptyNeedsScenario : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 13 }}>
                  <div className="sc-prov-card sc-prov-known">
                    <h4>Checked</h4>
                    <ul style={{ margin: '8px 0 0', paddingLeft: 16, color: 'var(--sc-muted)', fontSize: 12.5, lineHeight: 1.6 }}>
                      {report.uncertainty.checked.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                  <div className="sc-prov-card sc-prov-unknown">
                    <h4>Not checked</h4>
                    <ul style={{ margin: '8px 0 0', paddingLeft: 16, color: 'var(--sc-muted)', fontSize: 12.5, lineHeight: 1.6 }}>
                      {report.uncertainty.notChecked.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                  <div className="sc-prov-card sc-prov-infer">
                    <h4>Standing limits</h4>
                    <ul style={{ margin: '8px 0 0', paddingLeft: 16, color: 'var(--sc-muted)', fontSize: 12.5, lineHeight: 1.6 }}>
                      {report.uncertainty.limits.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                </div>
                <div className="sc-note" style={{ marginTop: 16 }}>
                  <ScalesIcon />
                  <span>
                    Completeness: <b>{report.completeness.score} of {report.completeness.max}</b> available
                    checks ran. The meter counts only real fields, so it cannot flatter a thin report —
                    with no model credit configured it can never read full.
                  </span>
                </div>
                <div style={{ marginTop: 18 }}>
                  <button type="button" className="sc-btn sc-btn-primary" onClick={() => go(5)}>
                    Find the next safe action <ArrowIcon />
                  </button>
                </div>
              </div>
            )
          )}

          {/* 06 ---------------------------------------------------------- */}
          {feature.id === 'actions' && (
            !report ? EmptyNeedsScenario : (
              <div className="sc-embed">
                <ChecklistPanel reportId={report.id} steps={report.checklist} />
                <div className="sc-note" style={{ marginTop: 14 }}>
                  <ShieldIcon />
                  <span>
                    Ticking a step records that <i>you</i> intend to do it — it is not a verification
                    result, and nothing here checks that the step was carried out.
                  </span>
                </div>
                <div style={{ marginTop: 16 }}>
                  <button type="button" className="sc-btn sc-btn-primary" onClick={() => go(6)}>
                    Review the full report <ArrowIcon />
                  </button>
                </div>
              </div>
            )
          )}

          {/* 07 ---------------------------------------------------------- */}
          {feature.id === 'report' && (
            !report ? EmptyNeedsScenario : (
              <div>
                {/* ReportView already renders ReportActions; a second copy here
                    put two identical Copy/Download pairs on the same panel. */}
                <div className="sc-embed sc-embed-scroll">
                  <ReportView report={report} storageNote={storageNote} />
                </div>
                <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 16 }}>
                  <button type="button" className="sc-btn sc-btn-sm" onClick={() => go(5)}>Back to the actions</button>
                  <button type="button" className="sc-btn sc-btn-sm" onClick={() => go(1)}>Try another scenario</button>
                  <button type="button" className="sc-btn sc-btn-primary sc-btn-sm" onClick={() => go(7)}>
                    History <ArrowIcon />
                  </button>
                </div>
              </div>
            )
          )}

          {/* 08 ---------------------------------------------------------- */}
          {feature.id === 'history' && (
            <div>
              {ranReports.length === 0 ? (
                <div className="sc-empty">
                  <ClockIcon style={{ width: 28, height: 28, color: 'var(--sc-faint)' }} />
                  <h3 style={{ marginTop: 14 }}>Nothing run yet in this tour</h3>
                  <p>Run a scenario and it will appear here, reopenable by its own address.</p>
                  <button type="button" className="sc-btn sc-btn-primary" style={{ marginTop: 20 }} onClick={() => go(1)}>
                    Choose an investigation <ArrowIcon />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {ranReports.map((r) => (
                    <div key={r.id} className="sc-scan-row">
                      <span className={r.level === 'high_risk' ? 'sc-dot sc-dot-crit' : 'sc-dot'} />
                      <b>{r.label}</b>
                      <Link className="sc-btn sc-btn-sm" style={{ marginLeft: 'auto' }} href={`/report/${r.id}`}>
                        Open report
                      </Link>
                    </div>
                  ))}
                </div>
              )}
              <div className="sc-note" style={{ marginTop: 16 }}>
                <EvidenceIcon />
                <span>
                  Reports are saved server-side and addressed by an unguessable id. The list of
                  <i> which</i> reports are yours lives in your own browser — the server has no
                  endpoint that lists them, so this is not cross-device account sync.
                </span>
              </div>
              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 18 }}>
                <Link className="sc-btn sc-btn-sm" href="/history">Open the real history page</Link>
                <button type="button" className="sc-btn sc-btn-sm" onClick={onRestart}>Restart the tour</button>
                <Link className="sc-btn sc-btn-primary sc-btn-sm" href="/analyze">
                  Analyze something of your own <ArrowIcon />
                </Link>
              </div>
            </div>
          )}

          {needsReport && report && run.status === 'running' && (
            <p className="sc-note" style={{ marginTop: 14 }}><InfoIcon /><span>Running…</span></p>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------- footer -- */}
      <div className="sc-tour-foot">
        <div style={{ display: 'flex', gap: 9 }}>
          <button type="button" className="sc-btn sc-btn-sm" onClick={() => go(index - 1)} disabled={index === 0}>
            Previous
          </button>
          <button type="button" className="sc-btn sc-btn-sm" onClick={() => go(index + 1)} disabled={index === TOUR.length - 1}>
            Next
          </button>
        </div>
        <div className="sc-progress">
          <span className="sc-progress-track"><span className="sc-progress-fill" style={{ width: `${progressPct}%` }} /></span>
          Feature {index + 1} of {TOUR.length}
        </div>
        <button type="button" className="sc-btn sc-btn-ghost sc-btn-sm" onClick={onRestart}>Restart tour</button>
      </div>
    </section>
  );
}
