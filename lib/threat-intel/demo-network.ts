import { extractIndicators } from './indicators';
import { groupIntoCampaigns, type Campaign, type ThreatReport } from './campaigns';

/**
 * A simulated reporting network.
 *
 * Every report below is invented for demonstration. No TrustLens user
 * submitted any of it, and the UI must label it as simulated wherever it is
 * shown — presenting fabricated reports as a real user base would be exactly
 * the kind of claim this product exists to argue against.
 *
 * What it demonstrates is real: these messages run through the same
 * normalisation and grouping code as live input, so the clustering, the
 * corroboration counts and the staleness rules are genuinely computed rather
 * than written out by hand.
 */

/** Demo-only key. A real deployment holds this server-side and rotates it. */
export const DEMO_KEY = 'trustlens-demo-indicator-key';

interface Seed {
  reporter: string;
  category: string;
  daysAgo: number;
  text: string;
}

/*
 * Three campaigns, each reported by several people who received a different
 * variant — different subdomain, different number, reworded pitch. That is
 * what a campaign actually looks like in the wild, and it is what makes
 * matching worth doing: no two of these messages are identical.
 */
const SEEDS: Seed[] = [
  // --- Campaign 1: HDFC KYC phishing, one domain, rotating numbers --------
  {
    reporter: 'sim-01', category: 'Bank KYC phishing', daysAgo: 6,
    text: 'Dear customer, your HDFC account will be blocked today. Complete KYC immediately at https://kyc.secure-hdfc.xyz/verify or call 9876543210.',
  },
  {
    reporter: 'sim-02', category: 'Bank KYC phishing', daysAgo: 4,
    text: 'URGENT: HDFC netbanking suspended. Verify KYC within 24 hours: https://update.secure-hdfc.xyz/kyc. Helpline 9811122233.',
  },
  {
    reporter: 'sim-03', category: 'Bank KYC phishing', daysAgo: 3,
    text: 'Your account is blocked due to expired KYC. Final notice. Update here https://secure-hdfc.xyz/reactivate and share the OTP with our executive.',
  },
  {
    reporter: 'sim-04', category: 'Bank KYC phishing', daysAgo: 1,
    text: 'HDFC alert: debit card blocked, KYC verification pending. Reactivate at https://card.secure-hdfc.xyz now. Officer will call from 9876543210.',
  },

  // --- Campaign 2: UPI "refund" collect request, one handle --------------
  {
    reporter: 'sim-05', category: 'UPI refund scam', daysAgo: 5,
    text: 'Your Amazon order was cancelled. Refund of Rs 2,499 pending. Accept the collect request and enter UPI PIN to receive: refunds@okaxis',
  },
  {
    reporter: 'sim-06', category: 'UPI refund scam', daysAgo: 2,
    text: 'Refund failed. Please approve the payment request from refunds@okaxis and enter your UPI PIN to claim the cashback.',
  },

  // --- Campaign 3: digital arrest, single reporter, stays preliminary ----
  {
    reporter: 'sim-07', category: 'Digital arrest', daysAgo: 2,
    text: 'Cyber Crime Department: a parcel in your name was seized. You are under digital arrest. Transfer the verification deposit to avoid police case. Officer 9900011122.',
  },

  // --- Campaign 4: an old one, now stale ---------------------------------
  {
    reporter: 'sim-08', category: 'Electricity disconnection', daysAgo: 64,
    text: 'Your electricity will be disconnected today at 9:30 PM. Previous bill not updated. Call officer immediately 9700088111 to avoid disconnection charge.',
  },
  {
    reporter: 'sim-09', category: 'Electricity disconnection', daysAgo: 62,
    text: 'Urgent notice: power disconnection today. Bill payment pending. Contact 9700088111 and install the app to update payment immediately.',
  },
];

function isoDaysAgo(days: number, now: Date): string {
  return new Date(now.getTime() - days * 86_400_000).toISOString();
}

/** Builds the simulated reports, running them through the real extractor. */
export function demoReports(now = new Date()): ThreatReport[] {
  return SEEDS.map((seed, i) => ({
    id: `sim_report_${i + 1}`,
    reporterId: seed.reporter,
    category: seed.category,
    indicators: extractIndicators(seed.text, DEMO_KEY),
    observedAt: isoDaysAgo(seed.daysAgo, now),
    synthetic: true,
  }));
}

/** The simulated campaigns, grouped by the production grouping code. */
export function demoCampaigns(now = new Date()): Campaign[] {
  return groupIntoCampaigns(demoReports(now), now);
}
