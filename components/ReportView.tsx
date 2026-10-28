import { CONTEXT_LABEL } from '@/lib/analysis/context-rules';
import type {
  AssessmentLevel,
  EvidenceStatus,
  Finding,
  Provenance,
  Report,
  SignalSeverity,
} from '@/lib/analysis/types';
import { ChecklistPanel } from './ChecklistPanel';
import { ReportActions } from './ReportActions';
import {
  AlertIcon,
  CheckIcon,
  ChecklistIcon,
  ChevronRightIcon,
  CloseIcon,
  EvidenceIcon,
  HelpIcon,
  InfoIcon,
  ScalesIcon,
  ShieldIcon,
  SparkIcon,
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

/** Collapsible block used for the supporting detail below the decision. */
function Disclose({
  title,
  count,
  children,
  defaultOpen = false,
}: {
  title: string;
  count?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="disclose" open={defaultOpen}>
      <summary>
        {title}
        {count && <span className="count">{count}</span>}
        <span className="chev" aria-hidden="true"><ChevronRightIcon /></span>
      </summary>
      <div className="disclose-body">{children}</div>
    </details>
  );
}

export function ReportView({ report, storageNote }: { report: Report; storageNote?: string }) {
  const severity = LEVEL_SEVERITY[report.assessment.level];
  const created = new Date(report.createdAt);
  const pct =
    report.completeness.max === 0
      ? 0
      : Math.round((report.completeness.score / report.completeness.max) * 100);

  return (
    <div>
      {report.isDemo && (
        <div className="banner banner-demo" style={{ marginBottom: 16 }}>
          <InfoIcon />
          <p>
            <strong>Demonstration case.</strong> A built-in example written for this product and
            analysed by the same pipeline as real input. It is not a real message from a real
            sender, and it does not accuse any real company or person.
          </p>
        </div>
      )}

      {/* ---------------------------------------------------- the decision -- */}
      <section className={`assessment sev-${severity}`} aria-labelledby="assessment-title">
        <div className="assessment-top">
          <span className="sev-badge">
            <span className="dot" />
            {LEVEL_LABEL[report.assessment.level]}
          </span>
          <span className="chip">{CONTEXT_LABEL[report.inputContext]}</span>
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

      {/* ------------------------------------------- the signature feature -- */}
      <section className="section" aria-labelledby="next-title">
        <div className="section-head">
          <h2 id="next-title">
            <ChecklistIcon className="inline-icon" /> What should I do next?
          </h2>
          <p>Tick each step as you complete it</p>
        </div>
        <div className="card card-pad">
          <ChecklistPanel reportId={report.id} steps={report.checklist} />
        </div>
      </section>

      <section className="section">
        <ReportActions report={report} />
      </section>

      {/* -------------------------------------------------- warning signs -- */}
      <section className="section" aria-labelledby="signals-title">
        <div className="section-head">
          <h2 id="signals-title">
            <AlertIcon className="inline-icon" /> Warning signs
          </h2>
          <p>Each shows the exact text that triggered it</p>
        </div>
        {report.signals.length === 0 ? (
          <div className="card card-pad">
            <p style={{ fontSize: 14, fontWeight: 560 }}>No rule matched this input.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13.5, marginTop: 8, lineHeight: 1.62 }}>
              The specific patterns this tool tests for are absent. That is genuinely useful
              information, but it is not confirmation that the content is legitimate — a scam
              written in unfamiliar wording, in another language, or delivered as an image would
              also produce this result. Work through the steps above before acting.
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

      {/* ------------------------------------------- questions to ask ------ */}
      {report.questions.length > 0 && (
        <section className="section" aria-labelledby="questions-title">
          <div className="section-head">
            <h2 id="questions-title">
              <HelpIcon className="inline-icon" /> Questions to ask before trusting this
            </h2>
            <p>Each one is hard to answer if the request is not genuine</p>
          </div>
          {report.questions.map((q) => (
            <article className="qa" key={q.id}>
              <p className="qa-q">
                <span className="qa-mark" aria-hidden="true">?</span>
                {q.question}
              </p>
              <p className="qa-why">{q.why}</p>
            </article>
          ))}
        </section>
      )}

      {/* -------------------------------------- supporting detail, folded -- */}
      <section className="section" aria-labelledby="detail-title">
        <div className="section-head">
          <h2 id="detail-title">
            <EvidenceIcon className="inline-icon" /> Supporting detail
          </h2>
          <p>Expand what you want to inspect</p>
        </div>

        <Disclose
          title="Evidence record — exactly what was and was not checked"
          count={`${report.evidence.length} record${report.evidence.length === 1 ? '' : 's'}`}
          defaultOpen
        >
          {report.evidence.map((e) => (
            <article key={e.id} className="ev" style={{ border: 0, padding: '0 0 14px' }}>
              <div className="ev-top">
                <strong>{e.source}</strong>
                <span className={`sev-badge st-${e.status}`}>{STATUS_LABEL[e.status]}</span>
              </div>
              <p className="ev-detail">{e.detail}</p>
              <p className="ev-method">method: {e.method}</p>
            </article>
          ))}
        </Disclose>

        <Disclose
          title="Findings, separated by how we know them"
          count={`${report.findings.length} finding${report.findings.length === 1 ? '' : 's'}`}
        >
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
                        {' '}— stated confidence: {f.confidence}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Disclose>

        {report.positives.length > 0 && (
          <Disclose
            title="Observations that did not raise concern"
            count={`${report.positives.length}`}
          >
            <p style={{ color: 'var(--text-faint)', fontSize: 12.5, lineHeight: 1.6, marginBottom: 12 }}>
              These are things the tool looked for and did not find. The absence of a warning sign
              is weak evidence — it narrows the likely failure modes, but it is never proof that
              the content is genuine.
            </p>
            {report.positives.map((p) => (
              <article className="pos" key={p.id}>
                <strong>
                  <CheckIcon />
                  {p.title}
                </strong>
                <p>{p.detail}</p>
              </article>
            ))}
          </Disclose>
        )}

        <Disclose title="What was analysed">
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5, lineHeight: 1.68, wordBreak: 'break-word' }}>
            {report.inputPreview}
          </p>
        </Disclose>
      </section>

      {/* ------------------------------------------------- completeness ---- */}
      <section className="section" aria-labelledby="completeness-title">
        <div className="section-head">
          <h2 id="completeness-title">
            <SparkIcon className="inline-icon" /> How complete is this investigation?
          </h2>
          <p>Counted from checks that really ran</p>
        </div>
        <div className="card card-pad">
          <div className="meter-head">
            <strong style={{ fontSize: 14 }}>
              {report.completeness.score} of {report.completeness.max} available checks completed
            </strong>
            <span className="meter-score">{pct}%</span>
          </div>
          <div className="meter-track">
            <div className="meter-fill" style={{ width: `${pct}%` }} />
          </div>
          <ul className="meter-items">
            {report.completeness.items.map((item) => (
              <li className="meter-item" key={item.label} data-present={item.present}>
                <span className="meter-mark" aria-hidden="true">
                  {item.present ? <CheckIcon /> : <CloseIcon />}
                </span>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.note}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------- uncertainty ----- */}
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

      <p style={{ marginTop: 26, color: 'var(--text-faint)', fontSize: 12.5, lineHeight: 1.6 }}>
        <ScalesIcon className="inline-icon" />
        TrustLens AI reports patterns and evidence. It cannot certify that content is genuine or
        fraudulent, and it does not establish intent. Treat this as one input to your decision,
        alongside verification through a channel you control.
      </p>
    </div>
  );
}
