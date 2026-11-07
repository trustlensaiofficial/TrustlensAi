import type { Metadata } from 'next';
import { Shell } from '@/components/ui/Shell';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { getTranslations } from '@/lib/i18n/server';
import { featureById } from '@/lib/features';
import { Kaval } from '@/components/ui/Kaval';
import { RespondFlow } from '@/components/ui/RespondFlow';

export const metadata: Metadata = {
  title: 'I think I have been scammed',
  description:
    'Tell TrustLens what has already happened and get the right next steps, including the 1930 cyber-financial fraud helpline when money has moved.',
};

export default async function RespondPage() {
  const feature = featureById('respond');
  const { t } = await getTranslations();
  return (
    <Shell>
      <div className="screen">
        <ScreenHeader
          title={t('feature.respond.title')}
          lede={t('screen.respond.lede')}
          backLabel={t('dock.dashboard')}
          icon={feature?.icon}
          hue={feature?.hue}
        />
        <RespondFlow />
        <Kaval />
      </div>
    </Shell>
  );
}
