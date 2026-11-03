import type { Metadata } from 'next';
import { Shell } from '@/components/ui/Shell';
import { ActivityList } from '@/components/ui/ActivityList';

export const metadata: Metadata = {
  title: 'Your checks',
  description: 'Everything you have checked, kept on your own device.',
};

export default function ActivityPage() {
  return (
    <Shell>
      <div className="page">
        <header className="page-head">
          <span className="chip chip-accent">Activity</span>
          <h1>Everything you have checked</h1>
          <p className="lede">
            Stored in this browser, on this device. They open with no network, and they are not
            uploaded anywhere — which also means they do not follow you to another device.
          </p>
        </header>
        <ActivityList />
      </div>
    </Shell>
  );
}
