import { NextResponse } from 'next/server';
import { probeProvider, resolveProvider } from '@/lib/analysis/llm';
import { caseStoreStatus } from '@/lib/cases/store';
import { probeSharedRateLimit, rateLimitStatus } from '@/lib/ratelimit';
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
  // Probe both before reporting, so neither is a guess from configuration.
  const [cases] = await Promise.all([caseStoreStatus(), probeSharedRateLimit()]);
  const limits = rateLimitStatus();

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
  // Stated whether good or bad: a dashboard that only mentions rate limiting
  // when it works is how per-instance counting goes unnoticed.
  notes.push(limits.note);
  if (!cases.available && cases.reason) notes.push(cases.reason);

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
        // True only when one counter is genuinely shared across instances.
        sharedRateLimiting: limits.shared,
        rateLimitKeyedTokens: limits.keyedTokens,
        rateLimitPerMinute: limits.limit,
        // False until the case migration is applied. The routes exist either
        // way and answer 503 with a reason, which is better than a green tick
        // over a table that does not exist.
        caseStorage: cases.available,
      },
      notes,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
