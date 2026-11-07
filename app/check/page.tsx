import type { Metadata } from 'next';
import { Shell } from '@/components/ui/Shell';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { CheckWorkspace } from '@/components/ui/CheckWorkspace';
import { Kaval } from '@/components/ui/Kaval';
import { featureForContext } from '@/lib/features';
import { getTranslations } from '@/lib/i18n/server';
import type { InputContext } from '@/lib/analysis/types';
import type { DictKey } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Check something',
  description: 'Investigate a message, website, job offer, invoice or payment request using evidence-first checks.',
};

const CONTEXTS: InputContext[] = ['generic', 'bank_scam', 'job_offer', 'invoice', 'proposal', 'website'];

export default async function CheckPage({ searchParams }: { searchParams: Promise<{ context?: string }> }) {
  const params = await searchParams;
  const context = CONTEXTS.includes(params.context as InputContext)
    ? (params.context as InputContext)
    : 'bank_scam';

  /*
   * The card that was tapped, carried into the header.
   *
   * Arriving with no context at all is a direct visit rather than a card tap,
   * so the screen falls back to the general title instead of pretending a
   * particular card opened it.
   */
  const from = params.context ? featureForContext(context) : undefined;
  const { t } = await getTranslations();

  return (
    <Shell>
      <div className="screen">
        <ScreenHeader
          title={from ? t(`feature.${from.id}.title` as DictKey) : t('check.step1')}
          lede={
            from ? t(`feature.${from.id}.blurb` as DictKey) : t('check.lede')
          }
          backLabel={t('dock.dashboard')}
          icon={from?.icon}
          hue={from?.hue}
        />
        <CheckWorkspace defaultContext={context} />
      </div>
      {/* Kaval travels with the screen, so asking "why was this flagged?"
          never costs you the report you are asking about. */}
      <Kaval />
    </Shell>
  );
}
