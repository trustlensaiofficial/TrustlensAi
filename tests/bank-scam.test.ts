import { beforeEach, describe, expect, it } from 'vitest';
import { detectContextSignals, CONTEXT_LABEL } from '../lib/analysis/context-rules';
import { analyze } from '../lib/analysis/orchestrator';
import { findDemoCase } from '../lib/demo/cases';
import type { Report } from '../lib/analysis/types';

beforeEach(() => {
  delete process.env.AI_GATEWAY_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
});

const ids = (r: Report) => r.signals.map((s) => s.id);

async function runDemo(slug: string): Promise<Report> {
  const d = findDemoCase(slug);
  if (!d) throw new Error(`missing demo: ${slug}`);
  return analyze({ text: d.text, kind: d.kind, context: d.context, liveChecks: false, isDemo: true });
}

describe('bank_scam is a first-class context', () => {
  it('has a label', () => {
    expect(CONTEXT_LABEL.bank_scam).toBe('Bank scam');
  });

  it('fires only in its own context', () => {
    const text = 'Please share the OTP to verify. Your account will be blocked.';
    expect(detectContextSignals(text, 'bank_scam').length).toBeGreaterThan(0);
    expect(detectContextSignals(text, 'invoice')).toHaveLength(0);
    expect(detectContextSignals(text, 'generic')).toHaveLength(0);
  });
});

describe('bank scam detection', () => {
  it('flags a secret request as critical', () => {
    const s = detectContextSignals('Kindly share the OTP sent to your number', 'bank_scam');
    expect(s.find((x) => x.id === 'bank.secret_request')?.severity).toBe('critical');
  });

  it('flags the "safe account" instruction and remote-access app', async () => {
    const r = await runDemo('bank-safe-account');
    expect(ids(r)).toContain('bank.safe_account_transfer');
    expect(ids(r)).toContain('bank.remote_access');
    expect(ids(r)).toContain('bank.account_block_threat');
    expect(r.assessment.level).toBe('high_risk');
  });

  it('flags the UPI collect deception', async () => {
    const r = await runDemo('upi-collect-refund');
    expect(ids(r)).toContain('bank.upi_collect');
    expect(r.assessment.level).toBe('high_risk');
  });

  it('flags the OTP phish and keeps the lookalike domain finding', async () => {
    const r = await runDemo('bank-otp-phish');
    expect(ids(r)).toContain('bank.secret_request');
    expect(ids(r)).toContain('url.brand_mismatch.hdfcbank');
    expect(r.inputContext).toBe('bank_scam');
  });

  it('leads the checklist with the independent callback', async () => {
    const r = await runDemo('bank-safe-account');
    expect(r.checklist[0]?.id).toBe('chk.bank.hang_up');
    expect(r.checklist.map((c) => c.id)).toContain('chk.bank.never_share');
  });

  it('asks the question that ends an impersonation call', async () => {
    const r = await runDemo('bank-otp-phish');
    expect(JSON.stringify(r.questions)).toMatch(/call you back on the number printed/i);
  });
});

describe('bank scam false positives', () => {
  it('stays silent on a genuine transaction alert', async () => {
    const r = await runDemo('benign-bank-notice');
    const bankSignals = ids(r).filter((i) => i.startsWith('bank.'));
    expect(bankSignals).toEqual([]);
  });

  it('does not fire on ordinary mentions of a bank or UPI', () => {
    for (const text of [
      'I paid the electricity bill through UPI this morning.',
      'My bank balance looks fine, thanks for checking.',
      'The bank is closed on Sunday, we can go Monday.',
      'I will transfer the rent to your account tonight.',
    ]) {
      expect(detectContextSignals(text, 'bank_scam'), text).toHaveLength(0);
    }
  });

  it('never asks the user for a real secret', async () => {
    const r = await runDemo('bank-otp-phish');
    const text = JSON.stringify(r).toLowerCase();
    // The product must warn about secrets, never solicit them.
    expect(text).not.toMatch(/enter your otp here|provide your pin to us|send us your cvv/);
  });
});

describe('every context stays mapped', () => {
  it('has a label for each context value', () => {
    const contexts = ['generic', 'bank_scam', 'job_offer', 'invoice', 'proposal', 'website'] as const;
    for (const c of contexts) {
      expect(CONTEXT_LABEL[c], c).toBeTruthy();
    }
  });
});
