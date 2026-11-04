import { NextResponse } from 'next/server';
import { probeProvider, resolveProvider } from '@/lib/analysis/llm';
import { storeStatus } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Reports which capabilities this deployment actually has.
 *
 * The contextual layer is probed with a real request rather than inferred
 * from a key being present: a configured provider that refuses every call on
 * billing is not an available capability, and reporting it as one puts a
 * green tick on the dashboard for something that does not work.
 *
 * Returns only booleans, status words and provider names — never a key, a
 * URL containing a project ref, or any part of a credential.
 */
export async function GET() {
  const provider = resolveProvider();
  const store = storeStatus();
  const ai = await probeProvider();

  const notes: string[] = [];
  if (ai.health === 'responding') {
    notes.push(`Contextual interpretation is live via ${provider}.`);
  } else if (ai.health === 'not_configured') {
    notes.push('No AI credential is configured. Fixed rules and link analysis are unaffected.');
  } else {
    notes.push(
      `${ai.reason ?? 'The AI provider is not serving requests.'} Fixed rules, link analysis and the response guidance are unaffected.`,
    );
  }
  notes.push(store.enabled ? 'Report persistence is configured.' : (store.reason ?? 'Report persistence is not configured.'));

  return NextResponse.json(
    {
      ok: true,
      capabilities: {
        deterministicRules: true,
        liveUrlChecks: true,
        // True only when the provider actually answered.
        contextualAnalysis: ai.health === 'responding',
        contextualProvider: provider,
        contextualHealth: ai.health,
        contextualReason: ai.reason,
        reportHistory: store.enabled,
      },
      notes,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
