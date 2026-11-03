import { describe, expect, it } from 'vitest';
import { detectTanglishSignals, TANGLISH_RULE_COUNT } from '../lib/analysis/tanglish';

const ids = (t: string) => detectTanglishSignals(t).map((s) => s.id);

/**
 * Both halves matter equally. Missing a Tamil scam fails the user it was
 * written for; flagging an ordinary Tamil message trains them to ignore the
 * product, which is worse than not detecting anything.
 */
describe('Tanglish scam detection', () => {
  it('catches the OTP demand that English rules miss entirely', () => {
    expect(ids('Sir, unga account verify panna OTP-ah share pannunga')).toContain('ta.otp_request');
    expect(ids('OTP number kudunga, bank la irundhu pesuren')).toContain('ta.otp_request');
    expect(ids('PIN ah sollunga seekiram')).toContain('ta.otp_request');
  });

  it('accepts the common spellings of the same word', () => {
    // One demand, four ways people actually type it.
    for (const verb of ['pannunga', 'panunga', 'pannuga', 'paNNunga']) {
      expect(ids(`OTP ah share ${verb}`), verb).toContain('ta.otp_request');
    }
    for (const give of ['kudunga', 'kodunga', 'koduga']) {
      expect(ids(`OTP ${give} sir`), give).toContain('ta.otp_request');
    }
  });

  it('catches the account-blocking threat', () => {
    expect(ids('Unga account inniku block aagidum, KYC update pannunga')).toContain('ta.account_block');
    expect(ids('KYC mudinjiduchu, account close aagum')).toContain('ta.account_block');
  });

  it('catches the safe-account transfer and fee demands', () => {
    expect(ids('Safe account ku panam transfer pannunga')).toContain('ta.money_transfer');
    expect(ids('Processing fees kattunga, apram loan varum')).toContain('ta.money_transfer');
  });

  it('catches remote-access and screen-sharing demands', () => {
    expect(ids('AnyDesk app download pannunga, naan help panren')).toContain('ta.remote_access');
    expect(ids('Unga screen share pannunga sir')).toContain('ta.remote_access');
  });

  it('catches authority impersonation', () => {
    expect(ids('Naan bank la irundhu pesuren')).toContain('ta.impersonation');
    expect(ids('Cyber crime department la irundhu call panren')).toContain('ta.impersonation');
  });

  it('catches manufactured urgency', () => {
    expect(ids('Udane pannunga, illa na problem aagum')).toContain('ta.urgency');
    expect(ids('Idhu dhaan kadaisi warning')).toContain('ta.urgency');
  });

  it('quotes the exact words it matched, so the report can show them', () => {
    const [signal] = detectTanglishSignals('Sir OTP-ah share pannunga udane');
    expect(signal).toBeDefined();
    expect(signal!.matches.length).toBeGreaterThan(0);
    expect(signal!.matches[0]!.text.toLowerCase()).toContain('otp');
  });

  it('leaves ordinary Tamil conversation alone', () => {
    const benign = [
      'Amma, naan hostel vandhutaen. Saaptacha?',
      'Enna pa, evlo neram wait panna venum?',
      'Nalla iruken. Nee eppadi iruka? Call pannu.',
      'Tomorrow class 9 maniku start aagum, late aagadha',
      'Birthday wishes da! Enjoy pannu.',
    ];
    for (const text of benign) {
      expect(ids(text), text).toEqual([]);
    }
  });

  it('does not fire on an ordinary English message', () => {
    expect(ids('Hi, can you send me the Q3 deck when you get a chance?')).toEqual([]);
  });

  it('does not fire on a genuine bank alert', () => {
    expect(ids('Rs 2,480.00 debited from A/c XX4412 at SPENCERS. Not you? Call the number on your card.')).toEqual([]);
  });

  it('handles a realistic mixed-language scam', () => {
    const found = ids(
      'HDFC Bank: Dear customer, unga account block aagidum. KYC update panna indha link click pannunga and OTP share pannunga.',
    );
    expect(found).toContain('ta.account_block');
    expect(found).toContain('ta.otp_request');
    expect(found.length).toBeGreaterThanOrEqual(3);
  });

  it('is stable when the same text is scanned twice', () => {
    // Module-level /g regexes carry lastIndex; a stale one silently skips.
    const text = 'OTP ah share pannunga udane';
    expect(ids(text)).toEqual(ids(text));
  });

  it('exposes its rule count for the completeness figure', () => {
    expect(TANGLISH_RULE_COUNT).toBeGreaterThanOrEqual(7);
  });
});
