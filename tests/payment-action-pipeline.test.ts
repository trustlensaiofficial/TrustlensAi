/**
 * The payment-action module reaching a real report.
 *
 * The unit tests in `payment-action.test.ts` prove the parsing. These prove
 * the wiring: that the finding actually arrives in the report a user sees,
 * carries the span it rests on, moves the assessment, and leads the checklist
 * with the step that stops the loss. A module nothing calls is not a feature.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { analyze } from '../lib/analysis/orchestrator';
import { findDemoCase } from '../lib/demo/cases';

beforeEach(() => {
  delete process.env.AI_GATEWAY_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
});

const REFUND_COLLECT =
  'Your order was cancelled. Refund of Rs 2,499 is pending. Accept the request and enter your UPI PIN to receive it.';

describe('the contradiction reaches the report', () => {
  it('raises a critical signal that quotes the words promising money in', async () => {
    const r = await analyze({ text: REFUND_COLLECT, liveChecks: false });

    const signal = r.signals.find((s) => s.id === 'payment.claim_contradiction');
    expect(signal).toBeDefined();
    expect(signal!.severity).toBe('critical');
    expect(signal!.category).toBe('payment');

    // The span is the evidence. A contradiction asserted without it is just
    // another opinion, so it must be present and must be real.
    const match = signal!.matches[0]!;
    // The whole promise, not the bare word that matched: "Refund" alone is
    // poor evidence, "Refund of Rs 2,499 is pending." is the claim itself.
    expect(match.text).toBe('Refund of Rs 2,499 is pending.');
    // And the offsets must still address exactly those characters.
    expect(REFUND_COLLECT.slice(match.start, match.end)).toBe(match.text);
  });

  it('carries the structured payment action, not just prose', async () => {
    const r = await analyze({ text: REFUND_COLLECT, liveChecks: false });
    expect(r.paymentAction).not.toBeNull();
    expect(r.paymentAction!.kind).toBe('enter_upi_pin');
    expect(r.paymentAction!.direction).toBe('user_pays');
    expect(r.paymentAction!.claimContradiction).toBe(true);
  });

  it('leads the checklist with refusing the PIN, because the prompt is open', async () => {
    const r = await analyze({ text: REFUND_COLLECT, liveChecks: false });
    expect(r.checklist[0]?.id).toBe('chk.pay.no_pin');
  });

  it('pushes the assessment off the bottom', async () => {
    const r = await analyze({ text: REFUND_COLLECT, liveChecks: false });
    expect(r.assessment.level).not.toBe('no_signals_detected');
    expect(r.assessment.signalScore).toBeGreaterThanOrEqual(10);
  });

  it('states the direction of money as a deterministic finding', async () => {
    const r = await analyze({ text: REFUND_COLLECT, liveChecks: false });
    const direction = r.findings.find((f) => f.statement.includes('moves money out of your account'));
    expect(direction).toBeDefined();
    // Parsed from the instruction, so never an inference.
    expect(direction!.provenance).toBe('deterministic');
  });

  it('always admits the beneficiary is unverified', async () => {
    const r = await analyze({ text: REFUND_COLLECT, liveChecks: false });
    expect(r.uncertainty.notChecked.some((u) => /receiving the money is genuine/i.test(u))).toBe(true);
    expect(r.uncertainty.notChecked.some((u) => /no access to bank or UPI transaction systems/i.test(u))).toBe(true);
  });
});

describe('a QR payload decoded on the device', () => {
  it('is parsed without the image ever being uploaded', async () => {
    const r = await analyze({
      text: 'Scan this to get your cashback',
      qrPayload: 'upi://pay?pa=cashback@okicici&pn=Cashback%20Cell&am=1999&cu=INR',
      liveChecks: false,
    });

    expect(r.paymentAction).not.toBeNull();
    expect(r.paymentAction!.upi?.payeeVpa).toBe('cashback@okicici');
    expect(r.paymentAction!.direction).toBe('user_pays');

    // The payee name is attacker-controlled, so it is reported as a claim.
    const named = r.findings.find((f) => f.statement.includes('cashback@okicici'));
    expect(named).toBeDefined();
    expect(named!.statement).toMatch(/not verified by any bank/i);
    expect(r.findings.some((f) => f.statement.includes('INR 1999'))).toBe(true);
  });
});

describe('ordering against a live caller', () => {
  it('still leads with hanging up on the safe-account scam', async () => {
    const d = findDemoCase('bank-safe-account')!;
    const r = await analyze({ text: d.text, kind: d.kind, context: d.context, liveChecks: false });

    // "transfer your balance to the safe account" is the canonical wording and
    // must be read as a transfer demand.
    expect(r.paymentAction?.kind).toBe('send_money');

    // But hanging up and ringing the bank back resolves the whole call,
    // including the transfer, so it outranks the refusal.
    expect(r.checklist[0]?.id).toBe('chk.bank.hang_up');
    expect(r.checklist[1]?.id).toBe('chk.pay.no_transfer');
  });
});

describe('restraint', () => {
  it('reports no payment action for an ordinary message', async () => {
    const r = await analyze({
      text: 'Hi Amma, I reached the station. Will call you after dinner.',
      liveChecks: false,
    });
    expect(r.paymentAction).toBeNull();
    expect(r.signals.some((s) => s.id === 'payment.claim_contradiction')).toBe(false);
  });

  it('does not raise a critical signal for a payment with no deceptive framing', async () => {
    // A plain request to pay is information, not a warning sign. Inflating it
    // would train people to ignore the signal that matters.
    const r = await analyze({
      text: 'Here is the link for the electricity bill: upi://pay?pa=tneb@okhdfc&am=1240&cu=INR',
      liveChecks: false,
    });
    expect(r.paymentAction?.detected).toBe(true);
    expect(r.paymentAction?.claimContradiction).toBe(false);
    expect(r.signals.some((s) => s.id === 'payment.claim_contradiction')).toBe(false);
  });
});
