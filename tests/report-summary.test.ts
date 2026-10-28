import { beforeEach, describe, expect, it } from 'vitest';
import { analyze } from '../lib/analysis/orchestrator';
import { findDemoCase } from '../lib/demo/cases';
import { buildPlainSummary, reportFileName } from '../lib/report-summary';
import type { Report } from '../lib/analysis/types';

beforeEach(() => {
  delete process.env.AI_GATEWAY_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
});

async function demoReport(slug: string): Promise<Report> {
  const demo = findDemoCase(slug)!;
  return analyze({ text: demo.text, kind: demo.kind, context: demo.context, liveChecks: false, isDemo: true });
}

/**
 * The summary is what leaves the product — pasted into an email, saved as a
 * file. It must carry its own caveats, because it loses the interface that
 * would otherwise supply them.
 */
describe('plain-text report summary', () => {
  it('includes the assessment, warning signs and next steps', async () => {
    const report = await demoReport('invoice-bank-change');
    const text = buildPlainSummary(report);
    expect(text).toContain('TrustLens AI');
    expect(text).toContain('STRONG WARNING SIGNS');
    expect(text).toContain('WHAT TO DO NEXT');
    expect(text).toContain('call the supplier on a number you already held');
  });

  it('carries the limitations with it', async () => {
    const report = await demoReport('invoice-bank-change');
    const text = buildPlainSummary(report);
    expect(text).toContain('Limits of this method');
    expect(text).toContain('Not checked');
    expect(text).toMatch(/cannot certify/i);
  });

  it('labels a demo case so a pasted summary cannot be mistaken for real', async () => {
    const report = await demoReport('job-offer-scam');
    expect(buildPlainSummary(report)).toContain('DEMONSTRATION CASE');
  });

  it('never claims a check that did not run', async () => {
    const report = await demoReport('job-offer-scam');
    const text = buildPlainSummary(report);
    // No link in this case, so nothing may claim a destination was contacted.
    expect(text).toContain('NOT CHECKED');
    expect(text).not.toMatch(/page title/i);
  });

  it('reports completeness honestly rather than as a full score', async () => {
    const report = await demoReport('business-proposal');
    const text = buildPlainSummary(report);
    expect(text).toMatch(/INVESTIGATION COMPLETENESS: \d+ of \d+ checks ran/);
    // With no model configured it can never be complete.
    expect(text).not.toMatch(/COMPLETENESS: (\d+) of \1 checks/);
  });

  it('builds a safe, dated filename', async () => {
    const report = await demoReport('invoice-bank-change');
    const name = reportFileName(report);
    expect(name).toMatch(/^trustlens-report-\d{4}-\d{2}-\d{2}-[0-9a-f]{8}\.txt$/);
    expect(name).not.toContain('/');
  });

  it('includes the questions to ask', async () => {
    const report = await demoReport('business-proposal');
    expect(buildPlainSummary(report)).toContain('QUESTIONS TO ASK');
  });
});
