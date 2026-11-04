import { describe, expect, it } from 'vitest';
import { detectSignals, ruleCount } from '../lib/analysis/detectors';

const ids = (text: string, kind: 'message' | 'url' | 'claim' = 'message') =>
  detectSignals(text, kind).map((s) => s.id);

describe('deterministic detectors', () => {
  it('flags a one-time-code request as critical', () => {
    const signals = detectSignals('Please share the OTP sent to your phone to confirm.', 'message');
    const cred = signals.find((s) => s.id === 'credentials.request');
    expect(cred).toBeDefined();
    expect(cred?.severity).toBe('critical');
  });

  it('flags irreversible payment rails', () => {
    expect(ids('Pay using Google Play card codes today')).toContain('payment.irreversible');
    expect(ids('Send 0.5 BTC to this bitcoin wallet')).toContain('payment.irreversible');
  });

  it('flags the isolation pattern used by digital-arrest scams', () => {
    const signals = detectSignals(
      'This is a digital arrest notice. Do not tell anyone and stay on the call.',
      'message',
    );
    const secrecy = signals.find((s) => s.id === 'secrecy.isolation');
    expect(secrecy?.severity).toBe('critical');
    expect(secrecy!.matches.length).toBeGreaterThanOrEqual(2);
  });

  it('flags remote-access tooling and app installs', () => {
    expect(ids('Install AnyDesk to let our agent fix your account')).toContain('link.attachment_risk');
    expect(ids('Download update.apk and open it')).toContain('link.attachment_risk');
  });

  it('reports the exact matched span for explainability', () => {
    const text = 'URGENT: your account will be suspended within 24 hours.';
    const signals = detectSignals(text, 'message');
    expect(signals.length).toBeGreaterThan(0);
    for (const s of signals) {
      for (const m of s.matches) {
        // The reported offsets must actually point at the reported text.
        expect(text.slice(m.start, m.end)).toBe(m.text);
      }
    }
  });

  it('does not fire on ordinary business correspondence', () => {
    const benign =
      'Hi Priya, thanks for the notes from standup. I have pushed the branch and will review your comments tomorrow morning. Let me know if the staging link looks right to you.';
    expect(detectSignals(benign, 'message')).toHaveLength(0);
  });

  it('does not fire on a normal transactional notice', () => {
    const benign =
      'Your order has shipped and should arrive on Thursday. You can view the delivery status from the Orders page in your account.';
    expect(detectSignals(benign, 'message')).toHaveLength(0);
  });

  it('applies claim-language rules only to claims', () => {
    const text = 'A new study proves this supplement cures all heart disease.';
    expect(ids(text, 'claim')).toContain('claim.absolute_language');
    expect(ids(text, 'message')).not.toContain('claim.absolute_language');
  });

  it('exposes a larger rule set for claims than for messages', () => {
    expect(ruleCount('claim')).toBeGreaterThan(ruleCount('message'));
  });

  it('does not share regex state between calls', () => {
    const text = 'Share your OTP now';
    const first = detectSignals(text, 'message');
    const second = detectSignals(text, 'message');
    expect(second.map((s) => s.id)).toEqual(first.map((s) => s.id));
    expect(second[0]?.matches).toEqual(first[0]?.matches);
  });
});

/**
 * A critical-severity rule firing on ordinary conversation is worse than a
 * miss: it teaches people to dismiss the product, and the next warning — the
 * real one — gets dismissed with it. These pin the request-vs-mention line.
 */
describe('credential requests: a mention is not a demand', () => {
  const ids = (t: string) => detectSignals(t, 'message').map((s) => s.id);

  it('stays silent when a one-time code is merely mentioned', () => {
    const benign = [
      'I got the OTP for the train booking, the ticket is confirmed. See you Sunday.',
      'The OTP never arrived, I had to book again.',
      'My card expiry date is next month, I should renew it.',
      'Did you receive the verification code from the college portal?',
    ];
    for (const text of benign) {
      expect(ids(text), text).not.toContain('credentials.request');
    }
  });

  it('still catches the demand, in either word order', () => {
    const scams = [
      'Please share the OTP sent to your mobile now',
      'To stop the transaction, enter your UPI PIN immediately',
      'The OTP has been sent — read it out to our executive',
      'Confirm your card number and CVV to release the refund',
      'Reply with the verification code to complete the process',
    ];
    for (const text of scams) {
      expect(ids(text), text).toContain('credentials.request');
    }
  });
});
