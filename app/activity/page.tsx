import type { Metadata } from 'next';
import { Shell } from '@/components/ui/Shell';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { getTranslations } from '@/lib/i18n/server';
import { featureById } from '@/lib/features';
import { ActivityList } from '@/components/ui/ActivityList';

export const metadata: Metadata = {
  title: 'Your checks',
  description: 'Everything you have checked, kept on your own device.',
};

export default async function ActivityPage() {
  const feature = featureById('activity');
  const { t } = await getTranslations();
  return (
    <Shell>
      <div className="screen">
        <ScreenHeader
          title={t('feature.activity.title')}
          lede={t('screen.activity.lede')}
          backLabel={t('dock.dashboard')}
          icon={feature?.icon}
          hue={feature?.hue}
        />
        <ActivityList />
      </div>
    </Shell>
  );
}
