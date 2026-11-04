/**
 * Incident response.
 *
 * The invariants here are the product's promises. A plan that routes someone
 * to the wrong agency, buries 1930 behind advice, quietly downgrades because a
 * later answer was milder, or implies the money will come back is not a
 * cosmetic bug — it is the harm the feature exists to prevent.
 */

import { describe, expect, it } from 'vitest';
import {
  allActionStates,
  furthestAction,
  isUserActionState,
  recoveryPlanFor,
  type UserActionState,
} from '../lib/incident/recovery-plan';

const ALL = allActionStates();

/** States where money has moved or been authorised. */
const LOSS: UserActionState[] = ['entered_upi_pin', 'approved_payment_request', 'transferred_money'];

/** States where no money moved and nothing is time-critical. */
const NO_LOSS: UserActionState[] = ['received_only', 'opened_link', 'scanned_qr_only'];

describe('coverage', () => {
  it('has a plan for all twelve contract states', () => {
    expect(ALL).toHaveLength(12);
    for (const state of ALL) {
      expect(() => recoveryPlanFor(state)).not.toThrow();
    }
  });

  it('orders the states by exposure, mildest first', () => {
    expect(ALL[0]).toBe('received_only');
    expect(ALL[ALL.length - 1]).toBe('transferred_money');
  });

  it('rejects anything that is not a state', () => {
    expect(isUserActionState('transferred_money')).toBe(true);
    expect(isUserActionState('sent_money')).toBe(false);
    expect(isUserActionState('')).toBe(false);
    expect(isUserActionState(null)).toBe(false);
    // Must not be fooled by inherited object properties.
    expect(isUserActionState('toString')).toBe(false);
  });
});

describe('invariants on every plan', () => {
  it('always carries the disclaimer', () => {
    for (const state of ALL) {
      const plan = recoveryPlanFor(state);
      expect(plan.disclaimer, state).toBeTruthy();
      expect(plan.disclaimer).toMatch(/cannot reverse a payment/i);
      expect(plan.disclaimer).toMatch(/nothing here guarantees/i);
    }
  });

  it('never promises recovery anywhere in its text', () => {
    for (const state of ALL) {
      const plan = recoveryPlanFor(state);
      const prose = [
        plan.title,
        plan.summary,
        plan.disclaimer,
        ...plan.steps.flatMap((s) => [s.action, s.why]),
        ...plan.officialChannels.map((c) => c.useWhen),
      ].join(' ');

      expect(prose, state).not.toMatch(/guaranteed recovery|we will recover|get your money back|will be refunded/i);
    }
  });

  it('numbers its steps from one, with no gaps', () => {
    for (const state of ALL) {
      const plan = recoveryPlanFor(state);
      expect(plan.steps.length).toBeGreaterThan(0);
      expect(plan.steps.map((s) => s.order)).toEqual(plan.steps.map((_, i) => i + 1));
    }
  });

  it('gives a reason for every step, not just an instruction', () => {
    // Someone under pressure complies with a reason and argues with an order.
    for (const state of ALL) {
      for (const step of recoveryPlanFor(state).steps) {
        expect(step.why.length, `${state}: "${step.action}"`).toBeGreaterThan(30);
      }
    }
  });

  it('offers at least one official channel', () => {
    for (const state of ALL) {
      expect(recoveryPlanFor(state).officialChannels.length, state).toBeGreaterThan(0);
    }
  });

  it('lists only government or bank channels — never a paid recovery service', () => {
    for (const state of ALL) {
      for (const channel of recoveryPlanFor(state).officialChannels) {
        if (!channel.url) continue;
        expect(channel.url, `${state}: ${channel.name}`).toMatch(/\.gov\.in/);
      }
    }
  });
});

describe('channel routing — these are not interchangeable', () => {
  it('sends an actual financial loss to 1930, first and marked urgent', () => {
    for (const state of LOSS) {
      const plan = recoveryPlanFor(state);
      const first = plan.officialChannels[0]!;
      expect(first.contact, state).toBe('1930');
      expect(first.urgent, state).toBe(true);
    }
  });

  it('does not route a financial loss to Chakshu', () => {
    // Chakshu is for reporting fraudulent *communications*. Offering it to
    // someone whose money has just gone wastes the hours that matter.
    for (const state of LOSS) {
      const names = recoveryPlanFor(state).officialChannels.map((c) => c.name).join(' ');
      expect(names, state).not.toMatch(/Chakshu/);
    }
  });

  it('does route a nuisance message to Chakshu', () => {
    for (const state of NO_LOSS) {
      const names = recoveryPlanFor(state).officialChannels.map((c) => c.name).join(' ');
      expect(names, state).toMatch(/Chakshu/);
    }
  });

  it('never marks a channel urgent on a plan where nothing was lost', () => {
    for (const state of NO_LOSS) {
      expect(recoveryPlanFor(state).officialChannels.some((c) => c.urgent), state).toBe(false);
    }
  });

  it('only offers money restoration after a complaint could exist', () => {
    // The I4C module releases funds a freeze already caught, so it is
    // meaningless before 1930 and must never appear instead of it.
    for (const state of ALL) {
      const plan = recoveryPlanFor(state);
      const hasMrm = plan.officialChannels.some((c) => /Money Restoration/i.test(c.name));
      if (!hasMrm) continue;
      expect(plan.officialChannels.some((c) => c.contact === '1930'), state).toBe(true);
    }
  });

  it('always tells the reader to use the number on their own card', () => {
    for (const state of ALL) {
      const bank = recoveryPlanFor(state).officialChannels.find((c) => /bank/i.test(c.name));
      if (!bank) continue;
      expect(bank.useWhen).toMatch(/never a number from the message/i);
    }
  });
});

describe('urgency', () => {
  it('treats every loss as immediate', () => {
    for (const state of LOSS) {
      expect(recoveryPlanFor(state).urgency, state).toBe('immediate');
    }
  });

  it('treats a live session as immediate even before any loss', () => {
    // Nothing else helps while someone is still watching the screen.
    expect(recoveryPlanFor('shared_screen').urgency).toBe('immediate');
    expect(recoveryPlanFor('granted_remote_access').urgency).toBe('immediate');
    expect(recoveryPlanFor('shared_otp_or_pin').urgency).toBe('immediate');
  });

  it('does not manufacture urgency where there is none', () => {
    for (const state of NO_LOSS) {
      expect(recoveryPlanFor(state).urgency, state).toBe('routine');
    }
  });
});

describe('the second scam', () => {
  it('warns about fake recovery agents on every immediate plan', () => {
    for (const state of ALL) {
      const plan = recoveryPlanFor(state);
      if (plan.urgency !== 'immediate') continue;
      const prose = plan.steps.map((s) => `${s.action} ${s.why}`).join(' ');
      expect(prose, state).toMatch(/recover the money|recovery/i);
      expect(prose, state).toMatch(/upfront fee|processing charge|charges a fee/i);
    }
  });

  it('says plainly that no genuine agency charges to recover stolen money', () => {
    const prose = recoveryPlanFor('transferred_money').steps.map((s) => s.why).join(' ');
    expect(prose).toMatch(/No genuine agency charges a fee/i);
  });
});

describe('the money-already-gone plan', () => {
  const plan = recoveryPlanFor('transferred_money');

  it('leads with the call, ahead of gathering anything', () => {
    expect(plan.steps[0]!.action).toMatch(/Call 1930 now/i);
    expect(plan.steps[0]!.action).toMatch(/before gathering documents|before you do anything else/i);
  });

  it('explains why the first hours decide the outcome', () => {
    expect(plan.steps[0]!.why).toMatch(/freeze/i);
    expect(plan.steps[0]!.why).toMatch(/first day or two|first hours/i);
  });

  it('tells the reader to tell someone they trust', () => {
    // Isolation is part of the method, and the instruction is also what makes
    // the second approach easier to refuse.
    const prose = plan.steps.map((s) => `${s.action} ${s.why}`).join(' ');
    expect(prose).toMatch(/someone you trust/i);
    expect(prose).toMatch(/isolating/i);
  });
});

describe('the UPI PIN plan corrects the deception directly', () => {
  const plan = recoveryPlanFor('entered_upi_pin');

  it('states that the money moved the other way', () => {
    expect(plan.summary).toMatch(/authorises a payment/i);
    expect(plan.summary).toMatch(/other way|out of your account/i);
  });

  it('tells the reader not to check their balance first', () => {
    expect(plan.steps[0]!.action).toMatch(/Do not wait until you have checked your balance/i);
  });
});

describe('approving a collect request', () => {
  it('names the mandate that keeps charging afterwards', () => {
    // The step people miss, which is why it is called out separately.
    const prose = recoveryPlanFor('approved_payment_request').steps.map((s) => `${s.action} ${s.why}`).join(' ');
    expect(prose).toMatch(/mandate|AutoPay/i);
    expect(prose).toMatch(/keeps taking money/i);
  });

  it('says a refund never needs approval', () => {
    expect(recoveryPlanFor('approved_payment_request').summary).toMatch(/refund never needs your approval/i);
  });
});

describe('furthestAction never regresses', () => {
  it('keeps the more exposed of two answers, in either order', () => {
    expect(furthestAction('transferred_money', 'opened_link')).toBe('transferred_money');
    expect(furthestAction('opened_link', 'transferred_money')).toBe('transferred_money');
  });

  it('upgrades when the new answer is worse', () => {
    expect(furthestAction('scanned_qr_only', 'entered_upi_pin')).toBe('entered_upi_pin');
  });

  it('handles an absent side', () => {
    expect(furthestAction(null, 'opened_link')).toBe('opened_link');
    expect(furthestAction('opened_link', null)).toBe('opened_link');
    expect(furthestAction(null, null)).toBeNull();
  });

  it('is stable when the same state is reported twice', () => {
    expect(furthestAction('installed_app', 'installed_app')).toBe('installed_app');
  });

  it('never downgrades across every pair', () => {
    // Exhaustive: the whole point of the function is that no ordering of
    // answers can make the plan milder than the worst thing reported.
    for (const a of ALL) {
      for (const b of ALL) {
        const result = furthestAction(a, b)!;
        const rank = (s: UserActionState) => ALL.indexOf(s);
        expect(rank(result), `${a} + ${b}`).toBe(Math.max(rank(a), rank(b)));
      }
    }
  });
});
