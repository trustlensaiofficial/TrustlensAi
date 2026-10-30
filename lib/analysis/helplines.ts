import type { InputContext, Report } from './types';

/**
 * Official reporting channels.
 *
 * Every entry is a government or regulator-run service, listed because a
 * report is only useful if the reader knows where to take it. Nothing here
 * is a private company, a "recovery agent" or a paid service — those are
 * themselves a common second-stage scam against people who have just been
 * defrauded.
 *
 * India is listed first because that is this prototype's stated audience.
 * The entries are deliberately few: a long list of numbers is paralysing at
 * the exact moment someone needs one clear next move.
 */
export interface Helpline {
  id: string;
  /** What this channel is for, in the reader's terms. */
  title: string;
  /** The number or address to use. */
  contact: string;
  /** A link where one exists, so the contact can be verified independently. */
  href?: string;
  /** When this is the right channel. */
  when: string;
  /** Shown first when true — the time-critical ones. */
  urgent?: boolean;
}

const CYBERCRIME: Helpline = {
  id: 'helpline.india.1930',
  title: 'National Cyber Crime Helpline (India)',
  contact: '1930',
  href: 'https://cybercrime.gov.in',
  when:
    'Call immediately if money has already left your account. The first few hours decide whether a transfer can be frozen.',
  urgent: true,
};

const PORTAL: Helpline = {
  id: 'helpline.india.portal',
  title: 'Report it officially',
  contact: 'cybercrime.gov.in',
  href: 'https://cybercrime.gov.in',
  when: 'File a written complaint, with or without a loss. A report helps even when nothing was taken.',
};

const BANK: Helpline = {
  id: 'helpline.bank',
  title: 'Your bank’s fraud line',
  contact: 'The number printed on your card',
  when:
    'Use the number on the back of your card or in your banking app — never a number from the message you are checking.',
  urgent: true,
};

const UPI: Helpline = {
  id: 'helpline.upi',
  title: 'NPCI UPI dispute',
  contact: 'npci.org.in — UPI complaint',
  href: 'https://www.npci.org.in/what-we-do/upi/dispute-redressal-mechanism',
  when: 'For a UPI collect request or transfer you did not intend.',
};

const LABOUR: Helpline = {
  id: 'helpline.jobs',
  title: 'Report a fake recruiter',
  contact: 'cybercrime.gov.in — Report Other Cyber Crime',
  href: 'https://cybercrime.gov.in',
  when: 'For job offers that ask for a fee, a deposit, or your documents before any interview.',
};

/**
 * Which channels to surface for a given report.
 *
 * Driven by what was actually found, not by severity alone: a clean report
 * still shows where to report something, because "I checked and it looked
 * fine" is not the same as "this is safe", and people do come back later.
 */
export function helplinesFor(report: Report): Helpline[] {
  const context: InputContext = report.inputContext;
  const level = report.assessment.level;
  const risky = level === 'high_risk' || level === 'elevated_risk' || level === 'some_signals';

  const out: Helpline[] = [];

  if (context === 'bank_scam') {
    out.push(BANK, CYBERCRIME, UPI);
  } else if (context === 'invoice') {
    out.push(BANK, CYBERCRIME);
  } else if (context === 'job_offer') {
    out.push(LABOUR, CYBERCRIME);
  } else if (risky) {
    out.push(CYBERCRIME, BANK);
  } else {
    out.push(PORTAL);
  }

  if (risky && !out.includes(PORTAL)) out.push(PORTAL);

  // Urgent channels first; otherwise keep the authored order.
  return out.slice(0, 4).sort((a, b) => Number(b.urgent ?? false) - Number(a.urgent ?? false));
}
