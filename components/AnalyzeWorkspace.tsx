'use client';

import { useCallback, useId, useRef, useState, useSyncExternalStore } from 'react';
import { DEMO_CASES, type DemoCase } from '@/lib/demo/cases';
import { MAX_INPUT_LENGTH } from '@/lib/analysis/normalize';
import { CONTEXT_LABEL } from '@/lib/analysis/context-rules';
import type { InputContext, InputKind, Report } from '@/lib/analysis/types';
import { addToHistory } from '@/lib/history';
import { dismiss, getDismissed, getServerDismissed, subscribeDismissed } from '@/lib/dismissible';
import {
  AlertIcon,
  ArrowIcon,
  BriefcaseIcon,
  CloseIcon,
  DocumentIcon,
  GlobeIcon,
  InfoIcon,
  LensIcon,
  MessageIcon,
  ReceiptIcon,
  SparkIcon,
} from './icons';
import { FloatingActions } from './FloatingActions';
import { ReportView } from './ReportView';

type KindChoice = 'auto' | InputKind;

/**
 * The five things people actually bring to this tool. Choosing one unlocks a
 * context-specific rule set, so an invoice is checked for changed payment
 * details rather than only for generic phishing wording.
 */
const CONTEXTS: Array<{ value: InputContext; icon: typeof MessageIcon; hint: string; kind: KindChoice }> = [
  { value: 'generic', icon: MessageIcon, hint: 'Email, SMS or chat', kind: 'auto' },
  { value: 'website', icon: GlobeIcon, hint: 'A link or domain', kind: 'url' },
  { value: 'job_offer', icon: BriefcaseIcon, hint: 'Recruitment message', kind: 'message' },
  { value: 'invoice', icon: ReceiptIcon, hint: 'Bill or payment request', kind: 'message' },
  { value: 'proposal', icon: DocumentIcon, hint: 'Vendor or investment pitch', kind: 'message' },
];

const PLACEHOLDERS: Record<InputContext, string> = {
  generic: 'Paste the full message — the wording is what gets examined…',
  website: 'Paste the link, for example https://example.com/account/verify',
  job_offer: 'Paste the recruiter message or offer, including any email address it came from…',
  invoice: 'Paste the invoice email, especially any note about payment or bank details…',
  proposal: 'Paste the proposal, pitch or partnership terms…',
};

const STAGES = [
  'Validating and classifying the input',
  'Applying deterministic warning-sign rules',
  'Parsing link structure offline',
  'Checking the destination over the network',
  'Interpreting context and assembling the report',
];

function groupDemos(): Array<[string, DemoCase[]]> {
  const groups = new Map<string, DemoCase[]>();
  for (const demo of DEMO_CASES) {
    const key = CONTEXT_LABEL[demo.context];
    const list = groups.get(key) ?? [];
    list.push(demo);
    groups.set(key, list);
  }
  return [...groups.entries()];
}

export function AnalyzeWorkspace() {
  const [text, setText] = useState('');
  const [context, setContext] = useState<InputContext>('generic');
  const [kind, setKind] = useState<KindChoice>('auto');
  const [liveChecks, setLiveChecks] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [storageNote, setStorageNote] = useState<string | undefined>();
  const [scenario, setScenario] = useState<string | null>(null);
  const dismissed = useSyncExternalStore(subscribeDismissed, getDismissed, getServerDismissed);
  const showHint = !dismissed.has('workspace-intro');
  const resultRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const textareaId = useId();

  const over = text.length > MAX_INPUT_LENGTH;
  const canSubmit = !loading && text.trim().length >= 3 && !over;

  const run = useCallback(
    async (payload: { text?: string; demoSlug?: string; kind?: KindChoice; context?: InputContext }) => {
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
            context: payload.context ?? 'generic',
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
          context: result.report.inputContext,
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
    },
    [liveChecks],
  );

  function loadDemo(demo: DemoCase) {
    setText(demo.text);
    setContext(demo.context);
    setKind(demo.kind);
    setScenario(demo.scenario);
    void run({ demoSlug: demo.slug });
  }

  function pickContext(next: InputContext) {
    setContext(next);
    const preset = CONTEXTS.find((c) => c.value === next);
    if (preset) setKind(preset.kind);
    setScenario(null);
  }

  return (
    <div>
      {showHint && (
        <div className="hint">
          <SparkIcon />
          <div className="hint-body">
            <strong>New here? Start with an example.</strong>
            <p>
              Pick a case from the right-hand panel to see a full report in a few seconds — the
              invoice and job-offer cases show the product at its most useful. Or choose what
              you are looking at below and paste your own.
            </p>
          </div>
          <button
            type="button"
            className="hint-dismiss"
            aria-label="Dismiss this tip"
            onClick={() => dismiss('workspace-intro')}
          >
            <CloseIcon />
          </button>
        </div>
      )}

      <div className="workspace">
        {/* --------------------------------------------------------- input -- */}
        <div className="card card-pad">
          <span className="field-label" id={`${textareaId}-ctx`}>
            What are you looking at?
          </span>
          <div className="context-grid" role="group" aria-labelledby={`${textareaId}-ctx`}>
            {CONTEXTS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  className="context-card"
                  aria-pressed={context === option.value}
                  onClick={() => pickContext(option.value)}
                >
                  <Icon />
                  <strong>{CONTEXT_LABEL[option.value]}</strong>
                  <span>{option.hint}</span>
                </button>
              );
            })}
          </div>

          <label className="field-label" htmlFor={textareaId} style={{ marginTop: 20 }}>
            Paste it here
          </label>
          <textarea
            id={textareaId}
            ref={inputRef}
            className="textarea"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setScenario(null);
            }}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSubmit) {
                void run({ text, kind, context });
              }
            }}
            placeholder={PLACEHOLDERS[context]}
            aria-invalid={over || undefined}
            aria-describedby={`${textareaId}-hint`}
            spellCheck={false}
          />

          {scenario && (
            <p className="scenario-note">
              <InfoIcon />
              <span>{scenario}</span>
            </p>
          )}

          <p className="field-hint" id={`${textareaId}-hint`}>
            Analysed server-side, and never used as an instruction to the model. You do not need to
            include your own passwords or card numbers to assess a message.
          </p>

          <div className="toolbar">
            <span className="chip chip-accent">
              <span className="dot" />
              {CONTEXT_LABEL[context]} rules active
            </span>
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
                  : 'Off — the analysis stays entirely offline and the report will say nothing was contacted.'}
              </p>
            </div>
          </div>

          <div className="toolbar" style={{ marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-primary btn-premium"
              disabled={!canSubmit}
              onClick={() => void run({ text, kind, context })}
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
                  setScenario(null);
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* --------------------------------------------------------- demos -- */}
        <aside className="card card-pad" aria-labelledby="demo-heading">
          <h3 id="demo-heading" style={{ marginBottom: 6 }}>Example cases</h3>
          <p style={{ color: 'var(--text-faint)', fontSize: 12.5, lineHeight: 1.55, marginBottom: 6 }}>
            Built-in demonstrations, including two ordinary messages so you can check the tool does
            not over-warn. Each runs through the same pipeline as real input.
          </p>
          {groupDemos().map(([group, cases]) => (
            <div key={group}>
              <p className="demo-group-title">{group}</p>
              <div className="demo-list">
                {cases.map((demo) => (
                  <button
                    key={demo.slug}
                    type="button"
                    className="demo-item"
                    disabled={loading}
                    onClick={() => loadDemo(demo)}
                  >
                    <strong>{demo.label}</strong>
                    <span>{demo.scenario}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>
      </div>

      {/* ------------------------------------------------------- results -- */}
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
                onClick={() => void run({ text, kind, context })}
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
          </section>
        )}
      </div>

      <FloatingActions
        actions={[
          ...(report
            ? [{ id: 'steps', label: 'Jump to next steps', icon: 'checklist' as const, href: '#next-title' }]
            : []),
          {
            id: 'new',
            label: 'New analysis',
            icon: 'new' as const,
            onSelect: () => {
              setText('');
              setReport(null);
              setError(null);
              setScenario(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
              inputRef.current?.focus();
            },
          },
          { id: 'examples', label: 'Example cases', icon: 'analyze' as const, href: '#demo-heading' },
          { id: 'history', label: 'Investigation history', icon: 'history' as const, href: '/history' },
        ]}
      />
    </div>
  );
}
