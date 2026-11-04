/**
 * The legacy `responsePlanFor` shim.
 *
 * This module no longer holds its own advice — it maps the seven legacy action
 * states onto the twelve in the contract and delegates to
 * `lib/incident/recovery-plan.ts`. What these tests guard is the mapping, and
 * that nothing was lost in the move.
 *
 * Two assertions here changed when the shim landed, and both because the new
 * engine is ordered better: a money-loss plan now leads with 1930 rather than
 * the bank, because the 1930 call is what triggers the freeze request to
 * whichever account currently holds the money. The bank call is still present
 * and still required — it is step two, not step one.
 */

import { describe, expect, it } from 'vitest';
import { responsePlanFor } from '../lib/analysis/response-plan';

describe('the legacy mapping', () => {
  it('does not escalate when the user has not acted', () => {
    expect(responsePlanFor('not_acted')).toBeNull();
    expect(responsePlanFor(null)).toBeNull();
    expect(responsePlanFor(undefined)).toBeNull();
  });

  it('maps every legacy state to a contract state', () => {
    const legacy = [
      'opened_link',
      'shared_credentials',
      'installed_app',
      'remote_access',
      'approved_payment',
      'sent_money',
    ] as const;
    for (const state of legacy) {
      const plan = responsePlanFor(state);
      expect(plan, state).not.toBeNull();
      expect(plan!.actionState, state).toBeTruthy();
      expect(plan!.steps.length, state).toBeGreaterThan(0);
    }
  });

  it('treats a shared credential as OTP-grade, not password-grade', () => {
    // The copy this replaced covered "bank, UPI, card, or OTP details" and led
    // with calling the bank. Mapping it to the password-only state would
    // downgrade the urgency of the more serious half, and under-warning is the
    // dangerous direction.
    const plan = responsePlanFor('shared_credentials')!;
    expect(plan.actionState).toBe('shared_otp_or_pin');
    expect(plan.urgency).toBe('immediate');
  });

  it('maps remote access and completed transfers to their contract names', () => {
    expect(responsePlanFor('remote_access')!.actionState).toBe('granted_remote_access');
    expect(responsePlanFor('approved_payment')!.actionState).toBe('approved_payment_request');
    expect(responsePlanFor('sent_money')!.actionState).toBe('transferred_money');
  });
});

describe('nothing was lost in the move', () => {
  it('distinguishes opening a link from exposing credentials', () => {
    const opened = responsePlanFor('opened_link')!;
    const exposed = responsePlanFor('shared_credentials')!;

    expect(opened.title).toContain('opened');
    expect(opened.urgency).toBe('routine');
    expect(opened.steps.some((s) => /sign out of other sessions|change that password/i.test(s.action))).toBe(true);

    expect(exposed.title).toContain('shared');
    expect(exposed.urgency).toBe('immediate');
    expect(exposed.steps.some((s) => /bank/i.test(s.action))).toBe(true);
  });

  it('still tells every exposed user to call their bank on the card number', () => {
    for (const state of ['shared_credentials', 'approved_payment', 'sent_money'] as const) {
      const plan = responsePlanFor(state)!;
      expect(plan.steps.some((s) => /call your bank/i.test(s.action)), state).toBe(true);
      expect(plan.steps.some((s) => /number (printed )?on your card/i.test(s.action)), state).toBe(true);
    }
  });

  it('never claims TrustLens reversed or recovered a payment', () => {
    for (const state of ['shared_credentials', 'approved_payment', 'sent_money'] as const) {
      const plan = responsePlanFor(state)!;
      expect(plan.summary.toLowerCase()).not.toMatch(/we have reversed|we recovered/);
      // The shim gained a mandatory disclaimer the old module did not have.
      expect(plan.disclaimer, state).toMatch(/cannot reverse a payment/i);
    }
  });
});

describe('money-loss plans lead with the freeze, then the bank', () => {
  it('puts 1930 first, because that is what triggers the freeze request', () => {
    for (const state of ['approved_payment', 'sent_money'] as const) {
      const plan = responsePlanFor(state)!;
      expect(plan.steps[0]!.action, state).toMatch(/1930/);
      // The bank is still required — second, not dropped.
      expect(plan.steps[1]!.action, state).toMatch(/bank/i);
      expect(plan.officialChannels[0]!.contact, state).toBe('1930');
    }
  });

  it('warns about the recovery scam, which the old module did not do for an approved payment', () => {
    for (const state of ['approved_payment', 'sent_money'] as const) {
      const prose = responsePlanFor(state)!.steps.map((s) => `${s.action} ${s.why}`).join(' ');
      expect(prose, state).toMatch(/offering to recover the money/i);
      expect(prose, state).toMatch(/No genuine agency charges a fee/i);
    }
  });
});
