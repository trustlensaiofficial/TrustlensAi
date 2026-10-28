import { beforeEach, describe, expect, it } from 'vitest';
import { detectContextSignals } from '../lib/analysis/context-rules';
import { analyze } from '../lib/analysis/orchestrator';
import { findDemoCase } from '../lib/demo/cases';
import type { Report } from '../lib/analysis/types';

beforeEach(() => {
  delete process.env.AI_GATEWAY_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
});

const ids = (r: Report) => r.signals.map((s) => s.id);

async function runDemo(slug: string): Promise<Report> {
  const demo = findDemoCase(slug);
  if (!demo) throw new Error(`missing demo: ${slug}`);
  return analyze({ text: demo.text, kind: demo.kind, context: demo.context, liveChecks: false, isDemo: true });
}

describe('context rules fire only in their own context', () => {
  it('invoice bank-change is critical on an invoice', () => {
    const text = 'Please note our bank details have changed. Do not use the old account.';
    const signals = detectContextSignals(text, 'invoice');
    const changed = signals.find((s) => s.id === 'invoice.changed_bank_details');
    expect(changed?.severity).toBe('critical');
  });

  it('the same text raises no context signal under a different context', () => {
    const text = 'Please note our bank details have changed. Do not use the old account.';
    expect(detectContextSignals(text, 'job_offer')).toHaveLength(0);
    expect(detectContextSignals(text, 'generic')).toHaveLength(0);
  });

  it('job-offer rules do not fire on generic text', () => {
    const text = 'No interview is required and a registration fee applies.';
    expect(detectContextSignals(text, 'job_offer').length).toBeGreaterThan(0);
    expect(detectContextSignals(text, 'generic')).toHaveLength(0);
  });
});

describe('new demo scenarios meet their stated expectations', () => {
  it('job-offer-scam flags fee, interview, free email and bank details', async () => {
    const report = await runDemo('job-offer-scam');
    expect(ids(report)).toContain('job.upfront_cost');
    expect(ids(report)).toContain('job.no_interview');
    expect(ids(report)).toContain('job.personal_email_recruiter');
    expect(ids(report)).toContain('job.premature_bank_details');
    expect(report.assessment.level).toBe('high_risk');
  });

  it('invoice-bank-change flags the detail change, urgency and discouraged call', async () => {
    const report = await runDemo('invoice-bank-change');
    expect(ids(report)).toContain('invoice.changed_bank_details');
    expect(ids(report)).toContain('invoice.payment_urgency');
    expect(ids(report)).toContain('invoice.verification_discouraged');
    expect(report.assessment.level).toBe('high_risk');
    // The decisive action must lead the checklist.
    expect(report.checklist[0]?.id).toBe('chk.inv.call_known_number');
  });

  it('business-proposal flags guaranteed return, pressure and upfront fee', async () => {
    const report = await runDemo('business-proposal');
    expect(ids(report)).toContain('proposal.guaranteed_return');
    expect(ids(report)).toContain('proposal.pressure_to_sign');
    expect(ids(report)).toContain('proposal.upfront_fee');
    expect(report.assessment.level).toBe('high_risk');
  });
});

describe('derived report sections', () => {
  it('produces context-appropriate questions to ask', async () => {
    const invoice = await runDemo('invoice-bank-change');
    expect(invoice.questions.length).toBeGreaterThan(0);
    expect(JSON.stringify(invoice.questions)).toMatch(/number I already have|bank details/i);

    const job = await runDemo('job-offer-scam');
    expect(JSON.stringify(job.questions)).toMatch(/registration number|interview|offer letter/i);
  });

  it('reports completeness from real fields and never invents a full score', async () => {
    const report = await runDemo('job-offer-scam');
    expect(report.completeness.max).toBeGreaterThan(0);
    expect(report.completeness.score).toBeLessThanOrEqual(report.completeness.max);
    // No model and no link, so contextual interpretation must count as absent.
    const model = report.completeness.items.find((i) => i.label === 'Contextual interpretation');
    expect(model?.present).toBe(false);
  });

  it('lists positives as observations on a benign message, without claiming safety', async () => {
    const report = await runDemo('benign-transactional');
    expect(report.positives.length).toBeGreaterThan(0);
    expect(report.assessment.headline.toLowerCase()).toContain('not a guarantee');
  });

  it('withholds positives when the input is too short for absence to mean anything', async () => {
    const report = await analyze({ text: 'hello', kind: 'message', liveChecks: false });
    expect(report.positives).toHaveLength(0);
  });

  it('records the selected context on the report', async () => {
    const report = await runDemo('invoice-bank-change');
    expect(report.inputContext).toBe('invoice');
    // Must still store a DB-legal input_kind.
    expect(['message', 'url', 'claim']).toContain(report.inputKind);
  });
});
