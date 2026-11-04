import { describe, expect, it } from 'vitest';
import {
  detectPaymentAction, extractVpas, parseUpiUri, paymentActionLabel,
} from '../lib/analysis/payment-action';

/**
 * The central claim of the product is that it explains the requested action,
 * not just that something looks suspicious. These pin that behaviour, and
 * pin the boundaries it must never cross.
 */
describe('UPI URI parsing', () => {
  it('reads the payee, amount and note from a pay link', () => {
    const upi = parseUpiUri('upi://pay?pa=merchant@okaxis&pn=Big%20Store&am=499.00&cu=INR&tn=Order123')!;
    expect(upi.payeeVpa).toBe('merchant@okaxis');
    expect(upi.payeeName).toBe('Big Store');
    expect(upi.amount).toBe('499.00');
    expect(upi.currency).toBe('INR');
    expect(upi.mode).toBe('pay');
  });

  it('distinguishes a collect request from a payment', () => {
    expect(parseUpiUri('upi://collect?pa=refunds@okaxis&am=2499')!.mode).toBe('collect');
  });

  it('returns null rather than guessing when there is no UPI scheme', () => {
    expect(parseUpiUri('https://example.com/pay?pa=someone@bank')).toBeNull();
  });

  it('does not mistake an email for a payment address', () => {
    expect(extractVpas('mail me at ravi@gmail.com')).toEqual([]);
    expect(extractVpas('pay to refunds@okaxis')).toEqual(['refunds@okaxis']);
  });
});

describe('the refund-that-is-really-a-debit', () => {
  it('catches a collect request dressed up as a refund', () => {
    const a = detectPaymentAction(
      'Your order was cancelled. Refund of Rs 2,499 is pending. Accept the request and enter your UPI PIN to receive it.',
    );
    expect(a.detected).toBe(true);
    expect(a.kind).toBe('enter_upi_pin');
    // The whole point: the money moves the other way.
    expect(a.direction).toBe('user_pays');
    expect(a.claimContradiction).toBe(true);
    expect(a.explanation).toMatch(/never enter a UPI PIN to receive money|opposite of what will happen/i);
  });

  it('tells the reader that P2P collect requests no longer exist', () => {
    // Worth more than the generic warning: someone posing as an individual
    // is describing a mechanism NPCI switched off on 1 October 2025.
    const a = detectPaymentAction('I have sent a payment request for Rs 500. Please approve the request.');
    expect(a.kind).toBe('approve_collect');
    expect(a.direction).toBe('user_pays');
    expect(a.explanation).toMatch(/1 October 2025/);
    expect(a.explanation).toMatch(/registered merchants/i);
  });

  it('catches the QR version of the same trick', () => {
    const a = detectPaymentAction('Scan this QR code to receive your cashback of Rs 500');
    expect(a.kind).toBe('scan_qr');
    expect(a.direction).toBe('user_pays');
    expect(a.claimContradiction).toBe(true);
    expect(a.explanation).toMatch(/take a payment, not send one/i);
  });

  it('does not flag a contradiction when no refund is claimed', () => {
    const a = detectPaymentAction('Please pay Rs 300 for the tickets, here is the request');
    expect(a.detected).toBe(true);
    expect(a.claimContradiction).toBe(false);
  });

  it('ranks the PIN step above a QR instruction that leads to it', () => {
    const a = detectPaymentAction('Scan the QR and then enter your UPI PIN to confirm');
    expect(a.kind).toBe('enter_upi_pin');
  });
});

describe('what it refuses to establish', () => {
  it('always says the beneficiary is unverified', () => {
    const a = detectPaymentAction('upi://pay?pa=someone@okaxis&pn=Govt%20Refund%20Cell&am=1');
    expect(a.unknowns.join(' ')).toMatch(/genuine/i);
    expect(a.unknowns.join(' ')).toMatch(/no access to bank or UPI transaction systems/i);
  });

  it('treats a payee name as attacker-controlled, not identity', () => {
    const a = detectPaymentAction('upi://pay?pa=x@okaxis&pn=State%20Bank%20Of%20India&am=100');
    expect(a.unknowns.join(' ')).toMatch(/set by whoever created the payment request/i);
  });

  it('never claims money has moved', () => {
    for (const t of ['Scan to receive refund', 'Accept the collect request', 'upi://pay?pa=a@b&am=5']) {
      const a = detectPaymentAction(t);
      expect(a.explanation.toLowerCase(), t).not.toMatch(/money (has|was) (received|credited|refunded)/);
    }
  });

  it('never asks for a PIN itself', () => {
    const texts = ['enter your upi pin to receive', 'scan qr for cashback', 'send Rs 5000 now'];
    for (const t of texts) {
      const a = detectPaymentAction(t);
      expect(a.explanation.toLowerCase(), t).not.toMatch(/(enter|share|give) your (pin|otp) (here|below|now)/);
    }
  });

  it('flags nothing on an ordinary message', () => {
    for (const t of [
      'Hi, are we still meeting at four?',
      'The ticket is confirmed, see you Sunday.',
      'Rs 2,480.00 debited from A/c XX4412 at SPENCERS. Not you? Call the number on your card.',
    ]) {
      expect(detectPaymentAction(t).detected, t).toBe(false);
    }
  });
});

describe('decoded QR payloads', () => {
  it('reads a UPI instruction out of a scanned code', () => {
    const a = detectPaymentAction('A friend sent me this code', 'upi://pay?pa=scammer@okaxis&pn=Refund&am=4999');
    expect(a.detected).toBe(true);
    expect(a.upi?.payeeVpa).toBe('scammer@okaxis');
    expect(a.upi?.amount).toBe('4999');
  });

  it('notes an open amount, which lets the payee choose', () => {
    const a = detectPaymentAction('scan this', 'upi://pay?pa=x@okaxis&pn=Store');
    expect(a.unknowns.join(' ')).toMatch(/amount, which is not fixed/i);
  });
});

describe('labels', () => {
  it('names the action in the second person', () => {
    expect(paymentActionLabel(detectPaymentAction('enter your upi pin'))).toMatch(/You are being asked/);
    expect(paymentActionLabel(detectPaymentAction('hello'))).toMatch(/No payment action/);
  });
});

describe('where the URI ends depends on what it is in', () => {
  it('reads a whole QR payload, spaces and all', () => {
    // A scanned code is nothing but the instruction, so an unencoded space in
    // the payee name must not truncate it. Stopping at the first space dropped
    // the amount while still producing a confident preview — half a payment
    // instruction, which is worse than none.
    const u = parseUpiUri('upi://pay?pa=shop@okaxis&pn=Ravi Stores&am=120&cu=INR');
    expect(u).not.toBeNull();
    expect(u!.payeeVpa).toBe('shop@okaxis');
    expect(u!.payeeName).toBe('Ravi Stores');
    expect(u!.amount).toBe('120');
  });

  it('still stops at whitespace for a URI embedded in prose', () => {
    // Here the space really is the end of the link, and swallowing the prose
    // after it would put "Reply STOP to opt out" in the payment note.
    const u = parseUpiUri('Pay here upi://pay?pa=a@b&am=50 Reply STOP to opt out');
    expect(u!.payeeVpa).toBe('a@b');
    expect(u!.amount).toBe('50');
    expect(u!.note).toBeNull();
  });

  it('keeps a parameter that follows a stray percent', () => {
    const u = parseUpiUri('upi://pay?pa=a@b&tn=100%25 off&am=10');
    expect(u!.amount).toBe('10');
  });
});
