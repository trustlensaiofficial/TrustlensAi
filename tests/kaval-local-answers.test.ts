import { describe, expect, it } from 'vitest';
import type { Report } from '@/lib/analysis/types';
import { answerKavalLocally } from '@/lib/assistant/local-answers';

const report: Report = {
  id: 'demo-report',
  inputKind: 'message',
  inputContext: 'bank_scam',
  inputPreview: 'Your bank KYC expires today. Share OTP now.',
  createdAt: '2026-11-04T00:00:00.000Z',
  assessment: {
    level: 'high_risk',
    headline: 'Multiple strong warning signs',
    summary: 'Urgent KYC language and an OTP request matched warning rules.',
    signalScore: 20,
  },
  signals: [{
    id: 'otp-request',
    title: 'Requests a one-time password',
    category: 'credentials',
    severity: 'critical',
    explanation: 'Legitimate bank staff should not ask for an OTP.',
    matches: [{ text: 'Share OTP now', start: 0, end: 14 }],
  }],
  evidence: [],
  findings: [],
  uncertainty: {
    checked: ['Deterministic message rules were applied.'],
    notChecked: ['The sender identity was not established.'],
    limits: ['No warning-sign match does not prove legitimacy.'],
  },
  checklist: [{ id: 'verify-bank', action: 'Call the bank using the number on your card', why: 'Use a channel you already trust.' }],
  positives: [],
  questions: [],
  completeness: { score: 1, max: 2, items: [{ label: 'Message text', present: true, note: 'Provided' }] },
  model: { used: false, provider: 'none', degraded: true, reason: 'Billing unavailable' },
  isDemo: true,
  persisted: false,
};

describe('Kaval local answers', () => {
  it('explains warning signs from the current report', () => {
    const answer = answerKavalLocally({ message: 'Why is this suspicious?', report });
    expect(answer).toContain('high risk');
    expect(answer).toContain('Requests a one-time password');
    expect(answer).toContain('Share OTP now');
    expect(answer).toContain('sender identity was not established');
  });

  it('prioritises the Indian cyber-fraud response when money has moved', () => {
    const answer = answerKavalLocally({ message: 'They took my money, what now?', report });
    expect(answer).toContain('1930');
    expect(answer).toContain('cybercrime.gov.in');
    expect(answer).toContain('Recovery is not guaranteed');
  });

  it('gives credential-compromise guidance for shared OTPs', () => {
    const answer = answerKavalLocally({ message: 'I shared my OTP with them', report });
    expect(answer).toContain('Treat the shared detail as compromised');
    expect(answer).toContain('contact the bank');
  });

  it('answers general scam-safety questions without a report', () => {
    const answer = answerKavalLocally({ message: 'How do I avoid a payment scam?' });
    expect(answer).toContain('Do not share OTPs');
    expect(answer).toContain('1930');
  });
});
