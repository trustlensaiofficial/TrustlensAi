import { beforeEach, describe, expect, it } from 'vitest';
import { DEMO_CASES, findDemoCase } from '../lib/demo/cases';
import { analyze } from '../lib/analysis/orchestrator';
import type { Report, SignalCategory } from '../lib/analysis/types';

/**
 * Each demo case carries an `expectation` string shown to reviewers in the UI.
 * These tests bind that promise to real behaviour, so the copy cannot drift
 * away from what the detector actually does — which is precisely the kind of
 * unverified claim this product exists to argue against.
 */

beforeEach(() => {
  delete process.env.AI_GATEWAY_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
});

async function run(slug: string): Promise<Report> {
  const demo = findDemoCase(slug);
  if (!demo) throw new Error(`missing demo case: ${slug}`);
  return analyze({ text: demo.text, kind: demo.kind, liveChecks: false, isDemo: true });
}

const categories = (r: Report): SignalCategory[] => r.signals.map((s) => s.category);
const ids = (r: Report): string[] => r.signals.map((s) => s.id);

describe('demo cases match their stated expectations', () => {
  it('every demo case has a unique slug and non-empty expectation', () => {
    const slugs = DEMO_CASES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const c of DEMO_CASES) {
      expect(c.expectation.length).toBeGreaterThan(20);
      expect(c.text.trim().length).toBeGreaterThan(20);
    }
  });

  it('digital-arrest: surfaces isolation, the arrest threat and the payment demand', async () => {
    const report = await run('digital-arrest');
    expect(ids(report)).toContain('secrecy.isolation');
    expect(categories(report)).toContain('threat');
    expect(categories(report)).toContain('payment');
    expect(report.assessment.level).toBe('high_risk');
  });

  it('bank-otp-phish: flags the code request and names the real domain', async () => {
    const report = await run('bank-otp-phish');
    const credentials = report.signals.find((s) => s.id === 'credentials.request');
    expect(credentials?.severity).toBe('critical');
    expect(ids(report)).toContain('url.brand_mismatch.hdfcbank');
    const brand = report.signals.find((s) => s.id === 'url.brand_mismatch.hdfcbank');
    expect(brand?.title).toContain('kyc-update-secure.xyz');
    expect(report.assessment.level).toBe('high_risk');
  });

  it('deepfake-payment: flags the secrecy demand and the irreversible transfer', async () => {
    const report = await run('deepfake-payment');
    expect(ids(report)).toContain('secrecy.isolation');
    expect(ids(report)).toContain('payment.irreversible');
    expect(report.assessment.level).toBe('high_risk');
  });

  it('deepfake-payment: does not claim to judge whether a video call was synthetic', async () => {
    const report = await run('deepfake-payment');
    const everything = JSON.stringify(report).toLowerCase();
    // We must never assert a verdict about the video itself.
    expect(everything).not.toContain('deepfake detected');
    expect(everything).not.toContain('synthetic video confirmed');
    expect(report.uncertainty.notChecked.length).toBeGreaterThan(0);
  });

  it('lookalike-url: identifies the brand-in-subdomain trick', async () => {
    const report = await run('lookalike-url');
    expect(ids(report)).toContain('url.brand_mismatch.paypal');
  });

  it('health-claim: flags absolute language and the suppression narrative', async () => {
    const report = await run('health-claim');
    expect(ids(report)).toContain('claim.absolute_language');
    expect(ids(report)).toContain('claim.suppression_narrative');
  });

  it('control cases stay silent and never imply the content is verified', async () => {
    for (const slug of ['benign-transactional', 'benign-internal']) {
      const report = await run(slug);
      expect(report.signals, `${slug} should match no rules`).toHaveLength(0);
      expect(report.assessment.level).toBe('no_signals_detected');
      expect(report.assessment.headline.toLowerCase()).toContain('not a guarantee');
      // Even with nothing found, the user still gets something to do.
      expect(report.checklist.length).toBeGreaterThan(0);
    }
  });

  it('no demo case produces a model inference without a model', async () => {
    for (const demo of DEMO_CASES) {
      const report = await run(demo.slug);
      expect(report.findings.every((f) => f.provenance !== 'model_inference')).toBe(true);
      expect(report.model.degraded).toBe(true);
    }
  });
});
