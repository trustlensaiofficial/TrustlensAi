import {
  Alert, Bank, Bell, Book, Briefcase, Globe, History, Lifebuoy, Message, Receipt, Scales,
} from '@/components/ui/icons';

/**
 * The ten things TrustLens does, in the order someone needs them.
 *
 * This list is the dashboard, the menu and the command palette — one array, so
 * those three can never disagree about what the product offers.
 *
 * Every `href` resolves to a real route and a real workflow. There is no entry
 * here for a capability that does not exist: a dashboard card that opens a
 * placeholder is how a demo gets mistaken for a product, and this one has to
 * survive someone opening it the day after they have been defrauded.
 *
 * The ordering is deliberate rather than alphabetical. Messages first because
 * that is how almost every scam arrives; money second because that is what is
 * at stake; recovery seventh because by the time someone needs it they are
 * looking for it by name, not browsing.
 */

export interface Feature {
  /** Stable key — used for translations and analytics, never shown. */
  id: string;
  href: string;
  title: string;
  /** One line. Two makes the grid ragged and nobody reads the second. */
  blurb: string;
  /** The verb on the card's action row. */
  action: string;
  icon: React.ReactNode;
  /** Drives the card's accent. A hue, not a colour, so both themes derive it. */
  hue: string;
  group: 'Investigate' | 'Act' | 'Learn';
}

export const FEATURES: Feature[] = [
  {
    id: 'message',
    href: '/check?context=generic',
    title: 'Message check',
    blurb: 'An SMS, WhatsApp, email or chat you were sent.',
    action: 'Check a message',
    icon: <Message />,
    hue: '#38BDF8',
    group: 'Investigate',
  },
  {
    id: 'link',
    href: '/check?context=website',
    title: 'Link and website check',
    blurb: 'Where a link really goes, and whether the site is a lookalike.',
    action: 'Check a link',
    icon: <Globe />,
    hue: '#22D3EE',
    group: 'Investigate',
  },
  {
    id: 'bank',
    href: '/check?context=bank_scam',
    title: 'Bank and UPI protection',
    blurb: 'OTP, PIN, refund and “safe account” pressure.',
    action: 'Check a payment request',
    icon: <Bank />,
    hue: '#FB7185',
    group: 'Investigate',
  },
  {
    id: 'job',
    href: '/check?context=job_offer',
    title: 'Job offer check',
    blurb: 'Recruitment messages that ask for a fee or a deposit.',
    action: 'Review an offer',
    icon: <Briefcase />,
    hue: '#A78BFA',
    group: 'Investigate',
  },
  {
    id: 'invoice',
    href: '/check?context=invoice',
    title: 'Invoice and payment request',
    blurb: 'Bills, and requests to change where money is sent.',
    action: 'Review an invoice',
    icon: <Receipt />,
    hue: '#F59E0B',
    group: 'Investigate',
  },
  {
    id: 'proposal',
    href: '/check?context=proposal',
    title: 'Investment and offer claims',
    blurb: 'Promised returns, deposits and pressure to decide now.',
    action: 'Review a claim',
    icon: <Scales />,
    hue: '#2DD4BF',
    group: 'Investigate',
  },
  {
    id: 'respond',
    href: '/respond',
    title: 'Something already happened',
    blurb: 'Money sent, OTP shared, or an app installed.',
    action: 'Get the next steps',
    icon: <Lifebuoy />,
    hue: '#F43F5E',
    group: 'Act',
  },
  {
    id: 'alerts',
    href: '/alerts',
    title: 'Scam alerts',
    blurb: 'Patterns several people have reported recently.',
    action: 'See what is circulating',
    icon: <Bell />,
    hue: '#818CF8',
    group: 'Act',
  },
  {
    id: 'activity',
    href: '/activity',
    title: 'Your reports and history',
    blurb: 'Reopen a past check, or export it as a report.',
    action: 'Open your reports',
    icon: <History />,
    hue: '#84CC16',
    group: 'Act',
  },
  {
    id: 'learn',
    href: '/story',
    title: 'How TrustLens works',
    blurb: 'What each check does, and what it cannot tell you.',
    action: 'See how it works',
    icon: <Book />,
    hue: '#60A5FA',
    group: 'Learn',
  },
];

/** The one thing someone in trouble needs before anything else. */
export const EMERGENCY = {
  number: '1930',
  label: 'India’s cyber-financial fraud helpline',
  note: 'If money has already left your account, call before anything else. The first hours decide whether it can be held.',
  icon: <Alert />,
} as const;

export function featureById(id: string): Feature | undefined {
  return FEATURES.find((f) => f.id === id);
}

/**
 * Which card opens which analysis context.
 *
 * Kept beside the feature list rather than inside the check screen, so the
 * card someone tapped and the header they land on cannot drift apart — the
 * screen reads as that card opening, with its icon and its hue.
 */
const CONTEXT_TO_FEATURE: Record<string, string> = {
  generic: 'message',
  website: 'link',
  bank_scam: 'bank',
  job_offer: 'job',
  invoice: 'invoice',
  proposal: 'proposal',
};

export function featureForContext(context: string): Feature | undefined {
  const id = CONTEXT_TO_FEATURE[context];
  return id ? featureById(id) : undefined;
}
