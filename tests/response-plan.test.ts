import { describe, expect, it } from 'vitest';
import { responsePlanFor } from '../lib/analysis/response-plan';

describe('action-aware response plans', () => {
  it('does not escalate when the user has not acted', () => {
    expect(responsePlanFor('not_acted')).toBeNull();
    expect(responsePlanFor(null)).toBeNull();
  });

  it('distinguishes opening a link from exposing credentials', () => {
    const opened = responsePlanFor('opened_link');
    const exposed = responsePlanFor('shared_credentials');
    expect(opened?.title).toContain('opened');
    expect(opened?.steps.some((step) => /change the reported state/i.test(step.action))).toBe(true);
    expect(exposed?.title).toContain('shared');
    expect(exposed?.steps.some((step) => /bank/i.test(step.action))).toBe(true);
  });

  it('treats approved payments and completed transfers as time-sensitive', () => {
    const approved = responsePlanFor('approved_payment');
    const sent = responsePlanFor('sent_money');
    expect(approved?.steps[0]?.action).toMatch(/bank/i);
    expect(sent?.steps[0]?.action).toMatch(/bank/i);
    expect(sent?.steps.some((step) => /1930/i.test(step.action))).toBe(true);
    expect(sent?.steps.some((step) => /recover/i.test(step.action))).toBe(true);
  });

  it('does not claim that TrustLens can reverse or recover a payment', () => {
    for (const state of ['shared_credentials', 'approved_payment', 'sent_money'] as const) {
      const plan = responsePlanFor(state);
      expect(plan?.summary.toLowerCase()).not.toMatch(/we have reversed|we recovered/);
      expect(plan?.steps.some((step) => /call your bank|bank.*official/i.test(step.action))).toBe(true);
    }
  });
});
