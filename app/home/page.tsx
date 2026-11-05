import Link from 'next/link';
import type { Metadata } from 'next';
import { Shell } from '@/components/ui/Shell';
import { FeatureCard } from '@/components/dashboard/FeatureCard';
import { InstallApp } from '@/components/ui/InstallApp';
import { Kaval } from '@/components/ui/Kaval';
import { RecentActivity } from '@/components/ui/RecentActivity';
import { EMERGENCY, FEATURES } from '@/lib/features';
import { getTranslations } from '@/lib/i18n/server';
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
export default async function Dashboard() {
  const { t } = await getTranslations();

  return (
    <Shell>
      <div className="dash">
        <section className="dash-hero">
          <span className="dash-eyebrow">
            <span className="dash-dot" aria-hidden="true" />
            {t('home.status')}
          </span>
          <h1>
            {t('home.title1')} <em>{t('home.title2')}</em>
          </h1>
          <p className="dash-sub">{t('home.sub')}</p>
          <div className="dash-acts">
            <Link href="/check" className="dash-act dash-act-primary">
              <Lens /> {t('home.startCheck')}
            </Link>
            <Link href="/respond" className="dash-act dash-act-ghost">
              <Lifebuoy /> {t('home.needHelp')}
            </Link>
          </div>
        </section>

        <section className="dash-section" aria-labelledby="dash-tools">
          <div className="dash-section-head">
            <h2 id="dash-tools">{t('home.toolsTitle')}</h2>
            <span className="dash-section-note">{t('home.toolsNote')}</span>
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
              <h2>{t('home.recentTitle')}</h2>
              <Link href="/activity" className="dash-link">
                {t('home.seeAll')} <Arrow />
              </Link>
            </div>
            <RecentActivity />
          </div>

          {/* The only red on the screen. If everything is urgent, nothing is. */}
          <aside className="dash-sos">
            <span className="dash-sos-icon" aria-hidden="true">{EMERGENCY.icon}</span>
            <h2>{t('home.sosTitle')}</h2>
            <p>{t('home.sosBody')}</p>
            <a href={`tel:${EMERGENCY.number}`} className="dash-sos-call">
              {EMERGENCY.number}
              <span>{EMERGENCY.label}</span>
            </a>
            <Link href="/respond" className="dash-link">
              {t('home.sosSteps')} <Arrow />
            </Link>
          </aside>
        </section>

        <InstallApp />

        <p className="dash-promise">
          <Shield />
          <span>{t('home.promise')}</span>
        </p>
      </div>
      <Kaval />
    </Shell>
  );
}
