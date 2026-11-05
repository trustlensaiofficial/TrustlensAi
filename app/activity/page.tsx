import type { Metadata } from 'next';
import { Shell } from '@/components/ui/Shell';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { featureById } from '@/lib/features';
import { ActivityList } from '@/components/ui/ActivityList';

export const metadata: Metadata = {
  title: 'Your checks',
  description: 'Everything you have checked, kept on your own device.',
};

export default function ActivityPage() {
  const feature = featureById('activity');
  return (
    <Shell>
      <div className="screen">
        <ScreenHeader
          title={feature?.title ?? 'Everything you have checked'}
          lede="Kept in this browser, on this device. They open with no network — and they do not follow you to another device unless you sign in."
          icon={feature?.icon}
          hue={feature?.hue}
        />
        <ActivityList />
      </div>
    </Shell>
  );
}
