import { CONTEXT_LABEL } from './analysis/context-rules';
import type { Report } from './analysis/types';

/**
 * Plain-text rendering of a report, used by both "copy summary" and the
 * file export.
 *
 * It is generated entirely from the report object, so it can never describe a
 * check that did not run. The caveats at the end travel with the text, because
 * a summary pasted into an email loses the surrounding interface that would
 * otherwise carry them.
 */

const LEVEL_TEXT: Record<Report['assessment']['level'], string> = {
  high_risk: 'STRONG WARNING SIGNS',
  elevated_risk: 'SERIOUS WARNING SIGNS',
  some_signals: 'SOME WARNING SIGNS',
  no_signals_detected: 'NO RULES MATCHED',
};

export function buildPlainSummary(report: Report): string {
  const lines: string[] = [];
  const rule = '='.repeat(60);

  lines.push('TrustLens AI — analysis summary');
  lines.push(rule);
  if (report.isDemo) {
    lines.push('DEMONSTRATION CASE — built-in example, not a real message.');
    lines.push('');
  }
  lines.push(`Assessment: ${LEVEL_TEXT[report.assessment.level]}`);
  lines.push(`What it is: ${CONTEXT_LABEL[report.inputContext]}`);
  lines.push(`Analysed:   ${new Date(report.createdAt).toLocaleString()}`);
  lines.push('');
  lines.push(report.assessment.headline);
  lines.push('');
  lines.push(report.assessment.summary);
  lines.push('');

  if (report.signals.length > 0) {
    lines.push(rule);
    lines.push(`WARNING SIGNS (${report.signals.length})`);
    lines.push('');
    for (const s of report.signals) {
      lines.push(`[${s.severity.toUpperCase()}] ${s.title}`);
      const match = s.matches[0]?.text;
      if (match) lines.push(`  triggered by: "${match.length > 90 ? `${match.slice(0, 89)}…` : match}"`);
      lines.push(`  ${s.explanation}`);
      lines.push('');
    }
  }

  if (report.positives.length > 0) {
    lines.push(rule);
    lines.push('OBSERVATIONS THAT DID NOT RAISE CONCERN');
    lines.push('(the absence of a warning sign is weak evidence, not proof)');
    lines.push('');
    for (const p of report.positives) lines.push(`- ${p.title}`);
    lines.push('');
  }

  lines.push(rule);
  lines.push('EVIDENCE — what was and was not checked');
  lines.push('');
  for (const e of report.evidence) {
    lines.push(`[${e.status.replace('_', ' ').toUpperCase()}] ${e.source}`);
    lines.push(`  ${e.detail}`);
    lines.push('');
  }

  lines.push(rule);
  lines.push('WHAT TO DO NEXT');
  lines.push('');
  report.checklist.forEach((step, i) => {
    lines.push(`${i + 1}. ${step.action}`);
    lines.push(`   Why: ${step.why}`);
    lines.push('');
  });

  if (report.questions.length > 0) {
    lines.push(rule);
    lines.push('QUESTIONS TO ASK BEFORE TRUSTING THIS');
    lines.push('');
    for (const q of report.questions) {
      lines.push(`- ${q.question}`);
      lines.push(`  Why: ${q.why}`);
      lines.push('');
    }
  }

  lines.push(rule);
  lines.push(`INVESTIGATION COMPLETENESS: ${report.completeness.score} of ${report.completeness.max} checks ran`);
  lines.push('');
  lines.push('Not checked:');
  for (const n of report.uncertainty.notChecked) lines.push(`- ${n}`);
  lines.push('');
  lines.push('Limits of this method:');
  for (const l of report.uncertainty.limits) lines.push(`- ${l}`);
  lines.push('');
  lines.push(rule);
  lines.push(
    'TrustLens AI reports patterns and evidence. It cannot certify content as',
    'genuine or fraudulent, and it does not establish intent. Treat this as one',
    'input to your decision, alongside verification through a channel you control.',
  );

  return lines.join('\n');
}

export function reportFileName(report: Report): string {
  const date = new Date(report.createdAt).toISOString().slice(0, 10);
  return `trustlens-report-${date}-${report.id.slice(0, 8)}.txt`;
}
