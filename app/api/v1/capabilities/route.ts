import { NextResponse } from 'next/server';
import { describeCapabilities, platformFromRequest } from '@/lib/capabilities';
import { probeProvider } from '@/lib/analysis/llm';
import { storeStatus } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * What this deployment can actually do, for the platform asking.
 *
 * The honest answer differs per operating system, and that difference is the
 * product feature: a user on iPhone learns that no app can read their
 * notifications, rather than concluding ours is merely switched off. Clients
 * render this list directly and must never collapse it into one badge.
 *
 * `cloud_ai` comes from a real probe of the provider, not from a key being
 * present — a provider refusing every call on billing is not a capability.
 */
export async function GET(request: Request) {
  const platform = platformFromRequest(request.headers);
  const [ai, store] = [await probeProvider(), storeStatus()];

  const capabilities = describeCapabilities({
    platform,
    cloudAiResponding: ai.health === 'responding',
    cloudAiReason: ai.reason ?? undefined,
    accountSyncEnabled: store.enabled,
    accountSyncReason: store.reason ?? undefined,
  });

  return NextResponse.json(
    {
      platform,
      capabilities,
      // Stated in the payload too, because the rule is easy to forget while
      // building a dashboard and expensive to get wrong.
      note: 'Render every capability on its own. There is no aggregate status, by design: capabilities differ per platform and per permission, and a single badge hides what a user needs to know.',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
