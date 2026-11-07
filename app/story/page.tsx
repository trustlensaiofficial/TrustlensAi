import type { Metadata } from 'next';
import { Shell } from '@/components/ui/Shell';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { getTranslations } from '@/lib/i18n/server';
import { featureById } from '@/lib/features';
import { StoryPlayer } from './StoryPlayer';
import './story.css';

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'What TrustLens AI is, and every capability explained one narrated scene at a time.',
};

export default async function StoryPage() {
  const feature = featureById('learn');
  const { t } = await getTranslations();
  return (
    <Shell>
      <div className="screen">
        <ScreenHeader
          title={t('feature.learn.title')}
          lede={t('screen.story.lede')}
          backLabel={t('dock.dashboard')}
          icon={feature?.icon}
          hue={feature?.hue}
        />
        <StoryPlayer />
      </div>
    </Shell>
  );
}
