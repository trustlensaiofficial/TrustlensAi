import Link from 'next/link';
import type { Metadata } from 'next';
import { Shell } from '@/components/ui/Shell';
import { FeatureCard } from '@/components/dashboard/FeatureCard';
import { InstallApp } from '@/components/ui/InstallApp';
import { Kaval } from '@/components/ui/Kaval';
import { RecentActivity } from '@/components/ui/RecentActivity';
import { EMERGENCY, FEATURES } from '@/lib/features';
import { Arrow, Lens, Lifebuoy, Shield } from '@/components/ui/icons';
import './dashboard.css';

export const metadata: Metadata = {
  title: 'Protection',
  description: 'Check a message, link or payment request, and see the evidence behind every answer.',
};

/**
 * The dashboard.
 *
 * Ten cards, in the order someone needs them, each opening a real workflow.
 * The features come from `lib/features.tsx` so this screen and the menu can
 * never disagree about what the product offers.
 *
 * A server component. The cards are client components only because the glass
 * has to know whether there is a pointer to track; the page itself ships no
 * JavaScript of its own.
 */
export default function Dashboard() {
  return (
    <Shell>
      <div className="dash">
        <section className="dash-hero">
          <span className="dash-eyebrow">
            <span className="dash-dot" aria-hidden="true" />
            Protection active
          </span>
          <h1>
            Pause. Verify. <em>Then act.</em>
          </h1>
          <p className="dash-sub">
            Check anything that asks you for money, details or a tap — and see the
            evidence behind the answer, not just a verdict.
          </p>
          <div className="dash-acts">
            <Link href="/check" className="dash-act dash-act-primary">
              <Lens /> Start a check
            </Link>
            <Link href="/respond" className="dash-act dash-act-ghost">
              <Lifebuoy /> I need help now
            </Link>
          </div>
        </section>

        <section className="dash-section" aria-labelledby="dash-tools">
          <div className="dash-section-head">
            <h2 id="dash-tools">What would you like to check?</h2>
            <span className="dash-section-note">Every card opens a real check</span>
          </div>
          <ul className="feat-grid">
            {FEATURES.map((feature, i) => (
              <FeatureCard key={feature.id} feature={feature} index={i} />
            ))}
          </ul>
        </section>

        <section className="dash-lower">
          <div className="dash-recent">
            <div className="dash-section-head">
              <h2>Your recent checks</h2>
              <Link href="/activity" className="dash-link">
                See all <Arrow />
              </Link>
            </div>
            <RecentActivity />
          </div>

          {/* The only red on the screen. If everything is urgent, nothing is. */}
          <aside className="dash-sos">
            <span className="dash-sos-icon" aria-hidden="true">{EMERGENCY.icon}</span>
            <h2>Already sent money?</h2>
            <p>{EMERGENCY.note}</p>
            <a href={`tel:${EMERGENCY.number}`} className="dash-sos-call">
              {EMERGENCY.number}
              <span>{EMERGENCY.label}</span>
            </a>
            <Link href="/respond" className="dash-link">
              See every step <Arrow />
            </Link>
          </aside>
        </section>

        <InstallApp />

        <p className="dash-promise">
          <Shield />
          <span>
            TrustLens analyses only what you choose to share with it. It does not read
            messages, calls or contacts from other apps on their own.
          </span>
        </p>
      </div>
      <Kaval />
    </Shell>
  );
}
