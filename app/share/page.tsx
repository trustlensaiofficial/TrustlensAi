import type { Metadata } from 'next';
import { Shell } from '@/components/ui/Shell';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { CheckWorkspace } from '@/components/ui/CheckWorkspace';
import { Kaval } from '@/components/ui/Kaval';
import { Share } from '@/components/ui/icons';
import type { InputContext } from '@/lib/analysis/types';
import { contextForShared, mergeSharedPayload } from '@/lib/share';
import { getTranslations } from '@/lib/i18n/server';

export const metadata: Metadata = {
  title: 'Check a shared message',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Where the Android share sheet lands.
 *
 * This is the integration people mean when they ask whether TrustLens "works
 * with WhatsApp". Once the app is installed, the manifest's `share_target`
 * puts TrustLens in the system share sheet, so a suspicious message can be
 * long-pressed in WhatsApp, Telegram, Messages or Gmail and sent straight
 * here, already in the box.
 *
 * It is worth being exact about what that is and is not. TrustLens does not
 * read those apps and cannot — it receives only the one message a person
 * deliberately handed it, through the operating system, with no access to
 * anything else in the conversation. That is the whole arrangement, and it is
 * a feature rather than a limitation: nothing else would be acceptable.
 *
 * GET rather than POST. A POST share target needs a service worker to
 * intercept the request and stash the body before the page exists, which adds
 * a failure mode for no benefit while the payload is text.
 */
export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{ text?: string; title?: string; url?: string }>;
}) {
  const params = await searchParams;

  // The merge rule lives in lib/share.ts because it is the part with real
  // decisions in it, and those are worth testing rather than eyeballing.
  const shared = mergeSharedPayload(params);
  const context: InputContext = contextForShared(shared);
  const { t } = await getTranslations();

  return (
    <Shell>
      <div className="screen">
        <ScreenHeader
          title={t('share.pageTitle')}
          lede={
            shared ? t('share.pageLede') : t('share.pageEmpty')
          }
          backLabel={t('dock.dashboard')}
          icon={<Share />}
          hue="#38BDF8"
        />
        <CheckWorkspace defaultContext={context} initialText={shared} />
      </div>
      <Kaval />
    </Shell>
  );
}
