import { describe, expect, it } from 'vitest';
import { helplinesFor } from '../lib/analysis/helplines';
import type { Report } from '../lib/analysis/types';

/** Minimal report shaped just enough to drive the selection. */
function reportWith(inputContext: Report['inputContext'], level: Report['assessment']['level']) {
  return { inputContext, assessment: { level } } as Report;
}

/**
 * These channels are what someone acts on after being told something is
 * wrong, so the rules behind them are worth pinning: the right channel for
 * the situation, the urgent one first, and never an empty list.
 */
describe('helplines', () => {
  it('always offers somewhere to go, whatever the verdict', () => {
    const contexts: Report['inputContext'][] = [
      'generic', 'bank_scam', 'job_offer', 'invoice', 'proposal', 'website',
    ];
    for (const c of contexts) {
      for (const level of ['high_risk', 'elevated_risk', 'some_signals', 'no_signals_detected'] as const) {
        expect(helplinesFor(reportWith(c, level)).length, `${c}/${level}`).toBeGreaterThan(0);
      }
    }
  });

  it('leads with the time-critical channel when money may be moving', () => {
    const first = helplinesFor(reportWith('bank_scam', 'high_risk'))[0];
    expect(first?.urgent).toBe(true);
  });

  it('points bank cases at the card, never at a number from the message', () => {
    const bank = helplinesFor(reportWith('bank_scam', 'high_risk'));
    const card = bank.find((h) => h.id === 'helpline.bank');
    expect(card?.contact).toMatch(/printed on your card/i);
    expect(card?.when).toMatch(/never a number from the message/i);
  });

  it('matches the channel to the situation', () => {
    expect(helplinesFor(reportWith('job_offer', 'high_risk')).map((h) => h.id))
      .toContain('helpline.jobs');
    expect(helplinesFor(reportWith('bank_scam', 'high_risk')).map((h) => h.id))
      .toContain('helpline.upi');
  });

  it('never lists a paid recovery service', () => {
    for (const c of ['generic', 'bank_scam', 'job_offer', 'invoice'] as const) {
      for (const h of helplinesFor(reportWith(c, 'high_risk'))) {
        expect(h.contact.toLowerCase()).not.toMatch(/recovery|refund agent|fee/);
        if (h.href) expect(h.href).toMatch(/gov\.in|npci\.org\.in/);
      }
    }
  });

  it('keeps the list short enough to act on', () => {
    for (const c of ['generic', 'bank_scam', 'job_offer', 'invoice'] as const) {
      expect(helplinesFor(reportWith(c, 'high_risk')).length).toBeLessThanOrEqual(4);
    }
  });
});
