import type { Metadata } from 'next';
import Link from 'next/link';
import { Shell } from '@/components/ui/Shell';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { getTranslations } from '@/lib/i18n/server';
import { ActivityList } from '@/components/ui/ActivityList';
import { Alert, Check, Close, Globe, Lock, Phone, Users } from '@/components/ui/icons';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What TrustLens processes, what it keeps, what it cannot do, and how to delete it.',
};

/** Stated plainly, including the parts that are unflattering. */
const DOES = [
  'Checks the text you paste, on the server, to run the rules and the link analysis.',
  'Keeps your reports in this browser so they open offline and without an account.',
  'Fetches a page you explicitly asked it to check, if you turn live link checks on.',
];

const DOES_NOT = [
  'Read your messages automatically. There is no notification access in this web version.',
  'Upload your message text to the campaign network. Only you can share indicators, and only deliberately.',
  'Export your contacts, track your location, or use your text to train a model.',
  'Sell anything, or show advertising based on what you check.',
];

const CANNOT = [
  { title: 'It cannot read WhatsApp', body: 'WhatsApp messages are end-to-end encrypted. No website can read them, and any product claiming otherwise is either wrong or doing something it should not. Paste or share the message instead.' },
  { title: 'It cannot find where a sender is', body: 'A phone number’s country code is not a location. Nothing in a message reveals where the person physically is, so TrustLens says "physical origin not established" rather than guessing.' },
  { title: 'It cannot certify that something is genuine', body: 'No warning signs means our rules did not match — not that it is safe. The report always says which checks ran and which did not.' },
  { title: 'It cannot recover money', body: 'If a payment has gone, TrustLens points you at 1930 and your bank fast. It has no power to reverse a transfer, and will never suggest it does.' },
];

export default async function PrivacyPage() {
  const { t } = await getTranslations();
  return (
    <Shell>
      <div className="screen">
        <ScreenHeader
          title={t('screen.privacy.title')}
          lede={t('screen.privacy.lede')}
          backLabel={t('dock.dashboard')}
          icon={<Lock />}
          hue="#60A5FA"
        />

        <section className="section">
          <div className="grid grid-2">
            <div className="card card-pad">
              <h3 className="col-head"><Check /> What TrustLens does</h3>
              <ul className="tick-list">{DOES.map((d, i) => <li key={i}>{d}</li>)}</ul>
            </div>
            <div className="card card-pad">
              <h3 className="col-head"><Close /> What it does not do</h3>
              <ul className="tick-list tick-never">{DOES_NOT.map((d, i) => <li key={i}>{d}</li>)}</ul>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>What it genuinely cannot do</h2>
            <p>The limits are part of the product, not fine print.</p>
          </div>
          <ul className="grid grid-2 how-grid">
            {CANNOT.map((c) => (
              <li key={c.title} className="card card-pad">
                <h3><Alert /> {c.title}</h3>
                <p>{c.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>On encryption, precisely</h2>
          </div>
          <p className="notice">
            <Globe />
            <span>
              Traffic to TrustLens is encrypted with HTTPS, and your saved reports sit in your own
              browser. That is <strong>not</strong> end-to-end encryption, and we will not call it
              that: when you ask the server to analyse text, the server can read that text. Saying
              otherwise would be the same overclaiming this product exists to catch.
            </span>
          </p>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>Your data, and deleting it</h2>
            <p>Everything stored on this device, with a delete button that really deletes.</p>
          </div>
          <ActivityList />
        </section>

        <section className="section">
          <div className="card card-pad cta-card">
            <div>
              <h2><Users /> If you ever share to the campaign network</h2>
              <p className="lede">
                It would be a normalised domain, a keyed token standing in for a number, a payment
                handle and a wording signature — never your message. That sharing is opt-in and is
                not switched on in this build.
              </p>
            </div>
            <Link href="/alerts" className="btn btn-secondary btn-lg">See how matching works</Link>
          </div>
        </section>

        <p className="report-foot">
          <Phone />
          If money has already moved, privacy is not the priority — call 1930 and your bank first,
          then come back.
        </p>
      </div>
    </Shell>
  );
}
