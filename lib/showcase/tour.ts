import type { InputContext } from '../analysis/types';

/**
 * The guided feature tour.
 *
 * Every entry drives a distinct, genuinely interactive panel — there are no
 * duplicate screens behind different headings, and no entry that leads
 * nowhere. Panels reuse the real product components wherever one exists, so
 * what a judge clicks is the shipping component, not a mockup of it.
 */

export type TourPanel =
  | 'overview'
  | 'choose'
  | 'investigate'
  | 'evidence'
  | 'unknowns'
  | 'actions'
  | 'report'
  | 'history';

export interface TourFeature {
  id: TourPanel;
  number: string;
  title: string;
  /** One plain-English sentence, shown under the title. */
  blurb: string;
  /** What the judge should actually do on this panel. */
  prompt: string;
}

export const TOUR: TourFeature[] = [
  {
    id: 'overview',
    number: '01',
    title: 'Meet TrustLens AI',
    blurb:
      'Suspicious content goes in; an understandable report and a practical next step come out.',
    prompt: 'Click each stage to see what it does.',
  },
  {
    id: 'choose',
    number: '02',
    title: 'Choose an investigation',
    blurb:
      'Tell it what you are holding — a message, a link, a job offer, an invoice, a proposal — and the rules change with it.',
    prompt: 'Pick a scenario to load it.',
  },
  {
    id: 'investigate',
    number: '03',
    title: 'Watch the investigation',
    blurb:
      'Rules, link structure and evidence are examined in order, then handed to the contextual layer.',
    prompt: 'Run the stages for the scenario you chose.',
  },
  {
    id: 'evidence',
    number: '04',
    title: 'Explore the evidence',
    blurb:
      'Every finding shows the exact text that triggered it and what that does — and does not — establish.',
    prompt: 'Expand any finding to see its reasoning.',
  },
  {
    id: 'unknowns',
    number: '05',
    title: 'Understand what is unknown',
    blurb:
      'What was checked, what could not be determined, and the standing limits of the method.',
    prompt: 'Compare the checked and not-checked columns.',
  },
  {
    id: 'actions',
    number: '06',
    title: 'Find the next safe action',
    blurb:
      'The central idea: findings become concrete steps you can take through a channel you already control.',
    prompt: 'Tick steps as you would carry them out.',
  },
  {
    id: 'report',
    number: '07',
    title: 'Review the report',
    blurb: 'The whole assessment in one place, with a summary you can copy or download.',
    prompt: 'Copy the summary, or download the report.',
  },
  {
    id: 'history',
    number: '08',
    title: 'History and navigation',
    blurb:
      'Past analyses are listed in your own browser — the server has no endpoint that lists reports.',
    prompt: 'Reopen anything you ran during this tour.',
  },
];

/** Scenarios offered in feature 02, mapped to real demo cases. */
export interface TourScenario {
  slug: string;
  label: string;
  context: InputContext;
  situation: string;
}

export const TOUR_SCENARIOS: TourScenario[] = [
  {
    slug: 'job-offer-scam',
    label: 'Suspicious recruitment offer',
    context: 'job_offer',
    situation: 'A role you never applied for, offered with no interview and a deposit to pay.',
  },
  {
    slug: 'invoice-bank-change',
    label: 'Invoice with changed bank details',
    context: 'invoice',
    situation: 'A real supplier, an overdue invoice, and payment details that just changed.',
  },
  {
    slug: 'lookalike-url',
    label: 'Misleading link',
    context: 'website',
    situation: 'A payment link that is not pointing where it appears to.',
  },
  {
    slug: 'bank-otp-phish',
    label: 'Bank impersonation message',
    context: 'bank_scam',
    situation: 'An SMS threatening suspension unless you verify and share a code.',
  },
  {
    slug: 'bank-safe-account',
    label: 'The “safe account” call',
    context: 'bank_scam',
    situation: 'A caller claiming to be bank fraud wants your balance moved and a remote-access app installed.',
  },
];

export function tourIndex(id: TourPanel): number {
  return TOUR.findIndex((f) => f.id === id);
}
