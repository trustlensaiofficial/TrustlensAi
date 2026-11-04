'use client';

import { useState } from 'react';
import type { Finding, Report, Signal, SignalSeverity, UserActionState } from '@/lib/analysis/types';
import { responsePlanFor } from '@/lib/analysis/response-plan';
import { helplinesFor } from '@/lib/analysis/helplines';
import { copy, type Lang } from '@/lib/i18n/strings';
import { Alert, Check, Chevron, Doc, Eye, Help, Lock, Phone, Scales, Shield } from './icons';

/** Severity drives the visual weight, so the worst thing is read first. */
const SEV_CLASS: Record<SignalSeverity, string> = {
  critical: 'chip-high',
  high: 'chip-high',
  medium: 'chip-check',
  low: '',
};

const LEVEL_TONE = {
  high_risk: 'high',
  elevated_risk: 'check',
  some_signals: 'check',
  no_signals_detected: 'clear',
} as const;

const ACTION_CHOICES: Array<{ value: UserActionState; label: string }> = [
  { value: 'not_acted', label: 'I only received it' },
  { value: 'opened_link', label: 'I opened the link' },
  { value: 'shared_credentials', label: 'I shared an OTP or account detail' },
  { value: 'installed_app', label: 'I installed an app' },
  { value: 'remote_access', label: 'I shared my screen or remote access' },
  { value: 'approved_payment', label: 'I approved a payment request' },
  { value: 'sent_money', label: 'I already sent money' },
];

/**
 * Highlights the exact matched span inside the quoted text.
 *
 * Shows the evidence rather than asserting it: a reader can see the words
 * that triggered a rule and judge the reasoning for themselves, which is the
 * whole point of the product.
 */
function Quote({ signal }: { signal: Signal }) {
  const first = signal.matches[0];
  if (!first) return null;
  return (
    <blockquote className="quote">
      <mark>{first.text}</mark>
      {first.note && <span className="quote-note">{first.note}</span>}
    </blockquote>
  );
}

function SignalCard({ signal, lang, index }: { signal: Signal; lang: Lang; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const t = copy(lang);
  return (
    <li className="signal rise" style={{ '--d': `${index * 50}ms` } as React.CSSProperties}>
      <button
        type="button"
        className="signal-head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={`chip ${SEV_CLASS[signal.severity]}`}>{t.severity[signal.severity]}</span>
        <span className="signal-title">{signal.title}</span>
        <Chevron className={`signal-caret${open ? ' open' : ''}`} />
      </button>

      {open && (
        <div className="signal-body">
          {signal.matches.length > 0 && (
            <>
              <p className="micro-label">{t.ui.exactText}</p>
              <Quote signal={signal} />
            </>
          )}
          <p className="micro-label">{t.ui.whyItMatters}</p>
          <p className="signal-why">{signal.explanation}</p>
          <p className="signal-prov prov prov-rule">
            {t.ui.howEstablished}: {t.ui.deterministic}
          </p>
        </div>
      )}
    </li>
  );
}

/** Findings grouped by how they were established — never blended. */
function FindingGroup({ findings, lang }: { findings: Finding[]; lang: Lang }) {
  const t = copy(lang);
  const groups = [
    { key: 'deterministic' as const, label: t.ui.deterministic, cls: 'prov-rule', icon: <Scales /> },
    { key: 'retrieved' as const, label: t.ui.retrieved, cls: 'prov-found', icon: <Eye /> },
    { key: 'model_inference' as const, label: t.ui.inference, cls: 'prov-ai', icon: <Help /> },
  ];
  return (
    <div className="grid grid-3">
      {groups.map((g) => {
        const items = findings.filter((f) => f.provenance === g.key);
        if (items.length === 0) return null;
        return (
          <div key={g.key} className="card card-pad prov-card">
            <p className={`prov ${g.cls} prov-head`}>
              {g.icon}
              {g.label}
            </p>
            <ul className="prov-list">
              {items.map((f, i) => (
                <li key={i}>{f.statement}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function ReportView({ report, lang }: { report: Report; lang: Lang }) {
  const t = copy(lang);
  const tone = LEVEL_TONE[report.assessment.level];
  const levelCopy = t.level[report.assessment.level];
  const helplines = helplinesFor(report);
  const [actionState, setActionState] = useState<UserActionState>('not_acted');
  const responsePlan = responsePlanFor(actionState);

  return (
    <div className="report">
      {/* The verdict. First thing read, so it is static and immediate. */}
      <section className={`verdict verdict-${tone}`}>
        <span className="verdict-icon" aria-hidden="true">
          {tone === 'clear' ? <Shield /> : <Alert />}
        </span>
        <div>
          <h2>{levelCopy.title}</h2>
          <p className="verdict-sub">{levelCopy.sub}</p>
          <p className="verdict-detail">{report.assessment.summary}</p>
        </div>
      </section>

      {report.model.degraded && (
        <p className="notice notice-check report-degraded">
          <Help />
          <span>{report.model.reason ?? 'The AI reading layer did not run. Everything below came from fixed rules and checks that did run.'}</span>
        </p>
      )}

      <section className="section">
        <div className="section-head">
          <h2>What have you done so far?</h2>
          <p>Choose the furthest step you took after receiving this. Your next steps change based on your answer.</p>
        </div>
        <div className="response-state-grid" role="group" aria-label="What you have done so far">
          {ACTION_CHOICES.map((choice) => (
            <button
              key={choice.value}
              type="button"
              className={`btn btn-sm ${actionState === choice.value ? 'btn-primary' : 'btn-ghost'}`}
              aria-pressed={actionState === choice.value}
              onClick={() => setActionState(choice.value)}
            >
              {choice.label}
            </button>
          ))}
        </div>
        {responsePlan ? (
          <div className="card card-pad response-plan">
            <div className="section-head">
              <h3>{responsePlan.title}</h3>
              <p>{responsePlan.summary}</p>
            </div>
            <ol className="steps">
              {responsePlan.steps.map((step, index) => (
                <li key={index} className="step">
                  <span className="step-num">{index + 1}</span>
                  <div>
                    <p className="step-action">{step.action}</p>
                    <p className="step-why">{step.why}</p>
                  </div>
                </li>
              ))}
            </ol>
            {lang !== 'en' && (
              <p className="muted-xs">Detailed incident-response steps are currently in English. The selected explanation language applies to the translated report copy.</p>
            )}
          </div>
        ) : (
          <p className="notice notice-check">No incident response is needed based on your answer yet. Do not click, pay or share codes; verify independently before acting.</p>
        )}
      </section>

      {/* Warning signs, worst first. */}
      <section className="section">
        <div className="section-head">
          <h2>{t.ui.whatWeFound}</h2>
          <p>
            {report.signals.length > 0
              ? `${report.signals.length} warning ${report.signals.length === 1 ? 'sign' : 'signs'}. Each one shows the exact words that triggered it.`
              : t.ui.noSignals}
          </p>
        </div>
        {report.signals.length > 0 ? (
          <ul className="signal-list">
            {report.signals.map((s, i) => (
              <SignalCard key={s.id} signal={s} lang={lang} index={i} />
            ))}
          </ul>
        ) : (
          <p className="notice notice-clear">
            <Check />
            <span>{t.ui.noSignals} That is not proof it is genuine — verify anything involving money or credentials.</span>
          </p>
        )}
      </section>

      {/* Provenance split. */}
      {report.findings.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>{t.ui.howEstablished}</h2>
            <p>Fixed rules, checks that actually ran, and AI interpretation are kept apart on purpose.</p>
          </div>
          <FindingGroup findings={report.findings} lang={lang} />
        </section>
      )}

      {/* What ran and what did not. */}
      <section className="section">
        <div className="grid grid-2">
          <div className="card card-pad">
            <h3 className="col-head"><Check /> {t.ui.whatWeChecked}</h3>
            <ul className="tick-list">
              {report.uncertainty.checked.map((c, i) => <li key={i}>{c}</li>)}
              {report.uncertainty.checked.length === 0 && <li className="muted">Nothing beyond the text itself.</li>}
            </ul>
          </div>
          <div className="card card-pad">
            <h3 className="col-head"><Help /> {t.ui.couldNotCheck}</h3>
            <ul className="tick-list tick-open">
              {report.uncertainty.notChecked.map((c, i) => <li key={i}>{c}</li>)}
              {report.uncertainty.notChecked.length === 0 && <li className="muted">Everything we attempt was attempted.</li>}
            </ul>
          </div>
        </div>
      </section>

      {/* Next steps. */}
      {report.checklist.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>{t.ui.whatToDo}</h2>
            <p>{t.goldenRule}</p>
          </div>
          <ol className="steps">
            {report.checklist.map((step, i) => (
              <li key={step.id} className="step rise" style={{ '--d': `${i * 45}ms` } as React.CSSProperties}>
                <span className="step-num">{i + 1}</span>
                <div>
                  <p className="step-action">{step.action}</p>
                  <p className="step-why">{step.why}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Questions to put to the sender. */}
      {report.questions.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>{t.ui.askSender}</h2></div>
          <ul className="ask-list">
            {report.questions.map((q) => (
              <li key={q.id} className="card card-pad">
                <p className="ask-q">{q.question}</p>
                <p className="ask-why">{q.why}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Official help. */}
      <section className="section">
        <div className="section-head">
          <h2>{t.ui.getHelp}</h2>
          <p>Official channels only. Never a number taken from the message you are checking.</p>
        </div>
        <ul className="grid grid-2 help-grid">
          {helplines.map((h) => (
            <li key={h.id} className={`card card-pad help-card${h.urgent ? ' help-urgent' : ''}`}>
              {h.urgent && <span className="chip chip-high"><Phone /> Call first</span>}
              <h3>{h.title}</h3>
              <p className="help-contact">
                {h.href ? <a href={h.href} target="_blank" rel="noopener noreferrer">{h.contact}</a> : h.contact}
              </p>
              <p className="help-when">{h.when}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="report-foot">
        <Doc />
        TrustLens AI reports patterns and evidence. It cannot certify that something is genuine or
        fraudulent, and it does not establish intent. Treat it as one input to your decision,
        alongside verification through a channel you control.
      </p>

      {!report.persisted && (
        <p className="report-foot">
          <Lock />
          This report was not saved to an account, so it will not appear in your history on another device.
        </p>
      )}
    </div>
  );
}
