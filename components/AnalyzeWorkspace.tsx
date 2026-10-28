'use client';

import { useId, useRef, useState } from 'react';
import { DEMO_CASES } from '@/lib/demo/cases';
import { MAX_INPUT_LENGTH } from '@/lib/analysis/normalize';
import type { InputKind, Report } from '@/lib/analysis/types';
import { addToHistory } from '@/lib/history';
import { AlertIcon, ArrowIcon, InfoIcon, LensIcon } from './icons';
import { ReportView } from './ReportView';

type KindChoice = 'auto' | InputKind;

const KIND_OPTIONS: Array<{ value: KindChoice; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'message', label: 'Message' },
  { value: 'url', label: 'Link' },
  { value: 'claim', label: 'Claim' },
];

/**
 * The stages the server runs, shown so the wait is legible.
 *
 * Note they are never marked "complete" on a timer: the whole analysis is one
 * request, so we cannot observe server-side progress. Showing a fake
 * progress bar would be exactly the kind of invented result this product
 * exists to argue against.
 */
const STAGES = [
  'Validating and classifying the input',
  'Applying deterministic warning-sign rules',
  'Parsing link structure offline',
  'Checking the destination over the network',
  'Interpreting context and assembling the report',
];

export function AnalyzeWorkspace() {
  const [text, setText] = useState('');
  const [kind, setKind] = useState<KindChoice>('auto');
  const [liveChecks, setLiveChecks] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [storageNote, setStorageNote] = useState<string | undefined>();
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaId = useId();

  const over = text.length > MAX_INPUT_LENGTH;
  const canSubmit = !loading && text.trim().length >= 3 && !over;

  async function run(payload: { text?: string; demoSlug?: string; kind?: KindChoice }) {
    setLoading(true);
    setError(null);
    setReport(null);
    setStorageNote(undefined);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: payload.text,
          demoSlug: payload.demoSlug,
          kind: payload.kind ?? 'auto',
          liveChecks,
        }),
      });

      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
            ? data.error
            : `The analysis failed (HTTP ${response.status}).`;
        setError(message);
        return;
      }

      const result = data as { report: Report; storageNote?: string };
      setReport(result.report);
      setStorageNote(result.storageNote);

      addToHistory({
        id: result.report.id,
        preview: result.report.inputPreview,
        kind: result.report.inputKind,
        level: result.report.assessment.level,
        createdAt: result.report.createdAt,
        isDemo: result.report.isDemo,
        persisted: result.report.persisted,
      });

      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch {
      setError(
        'The request could not be sent. Check your connection and try again — nothing was analysed or saved.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="workspace">
        {/* -------------------------------------------------------- input -- */}
        <div className="card card-pad">
          <label className="field-label" htmlFor={textareaId}>
            Paste a message, link or claim
          </label>
          <textarea
            id={textareaId}
            className="textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSubmit) {
                void run({ text, kind });
              }
            }}
            placeholder={'Paste the full text of a suspicious message, a link you were sent, or a claim you want to assess…'}
            aria-invalid={over || undefined}
            aria-describedby={`${textareaId}-hint`}
            spellCheck={false}
          />
          <p className="field-hint" id={`${textareaId}-hint`}>
            Your input is analysed server-side and is never used as an instruction to the model.
            Avoid pasting your own passwords or card numbers — they are not needed to assess a message.
          </p>

          <div className="toolbar">
            <div className="segmented" role="group" aria-label="What kind of input is this?">
              {KIND_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={kind === option.value}
                  onClick={() => setKind(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <span className="counter" data-over={over}>
              {text.length.toLocaleString()} / {MAX_INPUT_LENGTH.toLocaleString()}
            </span>
          </div>

          <div className="switch-row" style={{ marginTop: 18 }}>
            <button
              type="button"
              className="switch"
              role="switch"
              aria-checked={liveChecks}
              aria-labelledby={`${textareaId}-live`}
              onClick={() => setLiveChecks((v) => !v)}
            />
            <div>
              <span id={`${textareaId}-live`} style={{ fontSize: 13.5, fontWeight: 600 }}>
                Check links over the network
              </span>
              <p style={{ color: 'var(--text-faint)', fontSize: 12.5, lineHeight: 1.55, marginTop: 3 }}>
                {liveChecks
                  ? 'Resolves DNS and reads page metadata only. Private and internal addresses are refused, redirects are re-validated at each hop, and nothing is executed or downloaded.'
                  : 'Off — the analysis stays entirely offline and the report will say that nothing was contacted.'}
              </p>
            </div>
          </div>

          <div className="toolbar" style={{ marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canSubmit}
              onClick={() => void run({ text, kind })}
            >
              {loading ? 'Analyzing…' : 'Analyze'}
              {!loading && <ArrowIcon />}
            </button>
            {text.length > 0 && !loading && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setText('');
                  setReport(null);
                  setError(null);
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------- demos -- */}
        <aside className="card card-pad" aria-labelledby="demo-heading">
          <h3 id="demo-heading" style={{ marginBottom: 6 }}>Example cases</h3>
          <p style={{ color: 'var(--text-faint)', fontSize: 12.5, lineHeight: 1.55, marginBottom: 14 }}>
            Built-in demonstrations, including two ordinary messages so you can check the tool does
            not over-warn. Each runs through the same pipeline as real input.
          </p>
          <div className="demo-list">
            {DEMO_CASES.map((demo) => (
              <button
                key={demo.slug}
                type="button"
                className="demo-item"
                disabled={loading}
                onClick={() => {
                  setText(demo.text);
                  setKind(demo.kind);
                  void run({ demoSlug: demo.slug });
                }}
              >
                <strong>{demo.label}</strong>
                <span>{demo.expectation}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>

      {/* ------------------------------------------------------ results -- */}
      <div ref={resultRef} style={{ scrollMarginTop: 90 }}>
        {loading && (
          <section className="section" aria-live="polite" aria-busy="true">
            <div className="card card-pad">
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
                <LensIcon className="spin" />
                <strong style={{ fontSize: 14.5 }}>Analysis in progress</strong>
              </div>
              <div className="stages">
                {STAGES.map((stage, i) => (
                  <div className="stage" key={stage} data-state={i === 0 ? 'active' : 'queued'}>
                    <span className="stage-mark">{i + 1}</span>
                    {stage}
                  </div>
                ))}
              </div>
              <p style={{ color: 'var(--text-faint)', fontSize: 12.5, marginTop: 14, lineHeight: 1.55 }}>
                These run server-side in a single request, so results appear together rather than
                one stage at a time. No step is reported as finished before the report returns.
              </p>
              <div style={{ display: 'grid', gap: 9, marginTop: 20 }}>
                <div className="skeleton" style={{ height: 68 }} />
                <div className="skeleton" style={{ height: 44 }} />
                <div className="skeleton" style={{ height: 44 }} />
              </div>
            </div>
          </section>
        )}

        {error && !loading && (
          <section className="section" aria-live="assertive">
            <div className="banner banner-error">
              <AlertIcon />
              <p>
                <strong>Analysis failed.</strong> {error}
              </p>
            </div>
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void run({ text, kind })}
                disabled={!canSubmit}
              >
                Try again
              </button>
            </div>
          </section>
        )}

        {report && !loading && (
          <section className="section">
            <ReportView report={report} storageNote={storageNote} />
            {report.persisted && (
              <div className="banner" style={{ marginTop: 18 }}>
                <InfoIcon />
                <p>
                  <span className="banner-body">
                    Saved. This report stays reachable at its own address, and it is listed in your
                    History on this browser only — there is no endpoint that lists everyone&apos;s
                    reports.
                  </span>
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
