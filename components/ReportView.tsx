import type {
  AssessmentLevel,
  EvidenceStatus,
  Finding,
  Provenance,
  Report,
  SignalSeverity,
} from '@/lib/analysis/types';
import {
  AlertIcon,
  ChecklistIcon,
  EvidenceIcon,
  InfoIcon,
  ScalesIcon,
  ShieldIcon,
} from './icons';

const LEVEL_SEVERITY: Record<AssessmentLevel, SignalSeverity> = {
  high_risk: 'critical',
  elevated_risk: 'high',
  some_signals: 'medium',
  no_signals_detected: 'low',
};

const LEVEL_LABEL: Record<AssessmentLevel, string> = {
  high_risk: 'Strong warning signs',
  elevated_risk: 'Serious warning signs',
  some_signals: 'Some warning signs',
  no_signals_detected: 'No rules matched',
};

const KIND_LABEL = { message: 'Message', url: 'Link', claim: 'Claim' } as const;

const STATUS_LABEL: Record<EvidenceStatus, string> = {
  observed: 'Observed',
  unresolved: 'Could not determine',
  failed: 'Check failed',
  not_checked: 'Not checked',
};

const PROVENANCE: Record<Provenance, { label: string; note: string }> = {
  deterministic: {
    label: 'Rule match',
    note: 'Produced by a fixed rule with no model involved. Reproducible, and the triggering text is shown.',
  },
  retrieved: {
    label: 'Retrieved fact',
    note: 'Obtained by actually performing the stated check. This is an observation, not an interpretation.',
  },
  model_inference: {
    label: 'Model inference',
    note: 'An interpretation by a language model, reasoning only from the rule matches and evidence above. It can be wrong and is not a source of fact.',
  },
};

function groupByProvenance(findings: Finding[]): Array<[Provenance, Finding[]]> {
  const order: Provenance[] = ['deterministic', 'retrieved', 'model_inference'];
  return order
    .map((p) => [p, findings.filter((f) => f.provenance === p)] as [Provenance, Finding[]])
    .filter(([, list]) => list.length > 0);
}

export function ReportView({ report, storageNote }: { report: Report; storageNote?: string }) {
  const severity = LEVEL_SEVERITY[report.assessment.level];
  const created = new Date(report.createdAt);

  return (
    <div>
      {report.isDemo && (
        <div className="banner banner-demo" style={{ marginBottom: 16 }}>
          <InfoIcon />
          <p>
            <strong>Demonstration case.</strong> This is a built-in example written for this
            product, analysed by the same pipeline as real input. It is not a real message from a
            real sender.
          </p>
        </div>
      )}

      {/* Assessment */}
      <section className={`assessment sev-${severity}`} aria-labelledby="assessment-title">
        <div className="assessment-top">
          <span className="sev-badge">
            <span className="dot" />
            {LEVEL_LABEL[report.assessment.level]}
          </span>
          <span className="chip">{KIND_LABEL[report.inputKind]}</span>
          <span className="chip">
            {report.signals.length} warning sign{report.signals.length === 1 ? '' : 's'}
          </span>
          <span className="chip">
            <time dateTime={report.createdAt}>{created.toLocaleString()}</time>
          </span>
        </div>
        <h2 id="assessment-title">{report.assessment.headline}</h2>
        <p className="assessment-summary">{report.assessment.summary}</p>
      </section>

      {/* Honest capability notices */}
      {(report.model.degraded || storageNote) && (
        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          {report.model.degraded && report.model.reason && (
            <div className="banner banner-warn">
              <AlertIcon />
              <p>
                <strong>Contextual analysis unavailable.</strong>{' '}
                <span className="banner-body">{report.model.reason}</span>
              </p>
            </div>
          )}
          {storageNote && (
            <div className="banner banner-warn">
              <AlertIcon />
              <p>
                <strong>Not saved.</strong> <span className="banner-body">{storageNote}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* What was analysed */}
      <section className="section">
        <div className="section-head">
          <h2>What was analysed</h2>
          <p>Truncated echo of your input</p>
        </div>
        <div className="card card-pad">
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5, lineHeight: 1.68, wordBreak: 'break-word' }}>
            {report.inputPreview}
          </p>
        </div>
      </section>

      {/* Warning signs */}
      <section className="section" aria-labelledby="signals-title">
        <div className="section-head">
          <h2 id="signals-title">
            <AlertIcon className="inline-icon" /> Warning signs
          </h2>
          <p>Each one shows the exact text that triggered it</p>
        </div>
        {report.signals.length === 0 ? (
          <div className="card card-pad">
            <p style={{ fontSize: 14, fontWeight: 560 }}>No rule matched this input.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13.5, marginTop: 8, lineHeight: 1.62 }}>
              The specific patterns this tool tests for are absent. That is genuinely useful
              information, but it is not confirmation that the content is legitimate — a scam
              written in unfamiliar wording, in another language, or delivered as an image would
              also produce this result. Work through the verification steps below before acting.
            </p>
          </div>
        ) : (
          report.signals.map((signal) => (
            <article key={signal.id} className={`signal sev-${signal.severity}`}>
              <div className="signal-top">
                <h3>{signal.title}</h3>
                <span className="sev-badge">{signal.severity}</span>
              </div>
              <p>{signal.explanation}</p>
              {signal.matches.length > 0 && (
                <div className="signal-matches">
                  {signal.matches.slice(0, 6).map((m, i) => (
                    <code className="match" key={`${signal.id}-${m.start}-${i}`} title={m.note}>
                      {m.text.length > 120 ? `${m.text.slice(0, 119)}…` : m.text}
                    </code>
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </section>

      {/* Evidence */}
      <section className="section" aria-labelledby="evidence-title">
        <div className="section-head">
          <h2 id="evidence-title">
            <EvidenceIcon className="inline-icon" /> Evidence record
          </h2>
          <p>Exactly what was and was not checked</p>
        </div>
        {report.evidence.map((e) => (
          <article key={e.id} className="ev">
            <div className="ev-top">
              <strong>{e.source}</strong>
              <span className={`sev-badge st-${e.status}`}>{STATUS_LABEL[e.status]}</span>
              {e.retrievedAt && (
                <span className="chip">
                  <time dateTime={e.retrievedAt}>{new Date(e.retrievedAt).toLocaleTimeString()}</time>
                </span>
              )}
            </div>
            <p className="ev-detail">{e.detail}</p>
            <p className="ev-method">method: {e.method}</p>
          </article>
        ))}
      </section>

      {/* Findings by provenance */}
      <section className="section" aria-labelledby="findings-title">
        <div className="section-head">
          <h2 id="findings-title">
            <ScalesIcon className="inline-icon" /> Findings, separated by how we know them
          </h2>
          <p>Rule matches, retrieved facts and model inferences are never mixed</p>
        </div>
        {groupByProvenance(report.findings).map(([provenance, list]) => (
          <div className="prov-group" key={provenance}>
            <div className="prov-head">
              <span className={`prov-badge prov-${provenance}`}>{PROVENANCE[provenance].label}</span>
              <span className="prov-note">{PROVENANCE[provenance].note}</span>
            </div>
            <ul className="finding-list">
              {list.map((f, i) => (
                <li key={`${provenance}-${i}`}>
                  {f.statement}
                  {f.confidence && (
                    <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>
                      {' '}
                      — stated confidence: {f.confidence}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Uncertainty */}
      <section className="section" aria-labelledby="uncertainty-title">
        <div className="section-head">
          <h2 id="uncertainty-title">
            <ShieldIcon className="inline-icon" /> Certainty and its limits
          </h2>
          <p>What this conclusion rests on</p>
        </div>
        <div className="card card-pad">
          <div className="unc">
            <div className="unc-col">
              <h3>Checked</h3>
              <ul className="unc-checked">
                {report.uncertainty.checked.map((c, i) => (
                  <li key={`c-${i}`}><span>{c}</span></li>
                ))}
              </ul>
            </div>
            <div className="unc-col">
              <h3>Not checked</h3>
              <ul className="unc-notchecked">
                {report.uncertainty.notChecked.map((c, i) => (
                  <li key={`n-${i}`}><span>{c}</span></li>
                ))}
              </ul>
            </div>
            <div className="unc-col">
              <h3>Standing limits</h3>
              <ul className="unc-limits">
                {report.uncertainty.limits.map((c, i) => (
                  <li key={`l-${i}`}><span>{c}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Checklist */}
      <section className="section" aria-labelledby="checklist-title">
        <div className="section-head">
          <h2 id="checklist-title">
            <ChecklistIcon className="inline-icon" /> Verify before you act
          </h2>
          <p>Concrete steps for this specific input</p>
        </div>
        <ol className="steps">
          {report.checklist.map((step) => (
            <li key={step.id}>
              <strong>{step.action}</strong>
              <span>{step.why}</span>
            </li>
          ))}
        </ol>
      </section>

      <p style={{ marginTop: 26, color: 'var(--text-faint)', fontSize: 12.5, lineHeight: 1.6 }}>
        TrustLens AI reports patterns and evidence. It cannot certify that content is genuine or
        fraudulent, and it does not establish intent. Treat this as one input to your decision,
        alongside verification through a channel you control.
      </p>
    </div>
  );
}
