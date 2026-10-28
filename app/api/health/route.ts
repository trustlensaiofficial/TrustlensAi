import { NextResponse } from 'next/server';
import { resolveProvider } from '@/lib/analysis/llm';
import { storeStatus } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Reports which capabilities this deployment actually has.
 *
 * Returns only booleans and provider names — never a key, a URL containing a
 * project ref, or any part of a credential value. This is what the UI uses to
 * tell the user honestly which layers are live.
 */
export async function GET() {
  const provider = resolveProvider();
  const store = storeStatus();
  return NextResponse.json(
    {
      ok: true,
      capabilities: {
        deterministicRules: true,
        liveUrlChecks: true,
        contextualAnalysis: provider !== 'none',
        contextualProvider: provider,
        reportHistory: store.enabled,
      },
      notes: [
        provider === 'none'
          ? 'No AI credential configured: contextual interpretation is unavailable and the UI says so.'
          : `Contextual interpretation available via ${provider}.`,
        store.enabled
          ? 'Report persistence is configured.'
          : (store.reason ?? 'Report persistence is not configured.'),
      ],
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
