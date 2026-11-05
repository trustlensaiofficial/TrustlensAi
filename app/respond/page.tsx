import type { Metadata } from 'next';
import { Shell } from '@/components/ui/Shell';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { featureById } from '@/lib/features';
import { Kaval } from '@/components/ui/Kaval';
import { RespondFlow } from '@/components/ui/RespondFlow';

export const metadata: Metadata = {
  title: 'I think I have been scammed',
  description:
    'Tell TrustLens what has already happened and get the right next steps, including the 1930 cyber-financial fraud helpline when money has moved.',
};

export default function RespondPage() {
  const feature = featureById('respond');
  return (
    <Shell>
      <div className="screen">
        <ScreenHeader
          title={feature?.title ?? 'Something already happened'}
          lede="The right move depends on how far it went. Tell us what has happened and you get that plan, not a general warning."
          icon={feature?.icon}
          hue={feature?.hue}
        />
        <RespondFlow />
        <Kaval />
      </div>
    </Shell>
  );
}
