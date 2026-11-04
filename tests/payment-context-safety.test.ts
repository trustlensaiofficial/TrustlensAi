import { describe, expect, it } from 'vitest';
import { detectSignals } from '../lib/analysis/detectors';
import { detectContextSignals } from '../lib/analysis/context-rules';
import { detectTanglishSignals } from '../lib/analysis/tanglish';
import { analyze } from '../lib/analysis/orchestrator';

describe('protective advice and payment-action context', () => {
  it('does not flag a genuine warning that says never to share an OTP or UPI PIN', () => {
    const english = 'Never share your OTP or UPI PIN with anyone. Your bank will never ask for it.';
    const tanglish = 'OTP ah yaar kittayum share pannadheenga. UPI PIN solladheenga.';
    for (const text of [english, tanglish]) {
      const signals = [
        ...detectSignals(text, 'message'),
        ...detectContextSignals(text, 'bank_scam'),
        ...detectTanglishSignals(text),
      ];
      expect(signals.filter((signal) => signal.category === 'credentials'), text).toHaveLength(0);
    }
  });

  it('still flags a direct request for credentials', () => {
    const text = 'Please share your OTP and UPI PIN with our verification officer.';
    const signals = [
      ...detectSignals(text, 'message'),
      ...detectContextSignals(text, 'bank_scam'),
    ];
    expect(signals.some((signal) => signal.id === 'bank.secret_request')).toBe(true);
  });

  it('detects a QR code falsely presented as a way to receive a refund', async () => {
    const report = await analyze({
      text: 'Scan this QR code to receive your refund and enter your UPI PIN to confirm the credit.',
      kind: 'message',
      context: 'bank_scam',
      liveChecks: false,
    });
    expect(report.signals.map((signal) => signal.id)).toContain('bank.qr_receive_money');
    expect(report.signals.map((signal) => signal.id)).toContain('bank.secret_request');
  });

  it('does not tell a user that scanning a QR alone proves a debit', async () => {
    const report = await analyze({
      text: 'I scanned a QR code but did not enter my UPI PIN or approve any payment.',
      kind: 'message',
      context: 'bank_scam',
      liveChecks: false,
    });
    expect(report.assessment.summary).not.toMatch(/money was transferred/i);
  });
});
