import type { Metadata } from 'next';
import { Shell } from '@/components/ui/Shell';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { featureById } from '@/lib/features';
import { StoryPlayer } from './StoryPlayer';
import './story.css';

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'What TrustLens AI is, and every capability explained one narrated scene at a time.',
};

export default function StoryPage() {
  const feature = featureById('learn');
  return (
    <Shell>
      <div className="screen">
        <ScreenHeader
          title={feature?.title ?? 'How TrustLens works'}
          lede="Every check the product runs, narrated one scene at a time — including what each one cannot tell you."
          icon={feature?.icon}
          hue={feature?.hue}
        />
        <StoryPlayer />
      </div>
    </Shell>
  );
}
