import { NextResponse } from 'next/server';
import { z } from 'zod';
import { analyze } from '@/lib/analysis/orchestrator';
import { MAX_INPUT_LENGTH, validateInput } from '@/lib/analysis/normalize';
import { checkRateLimit, clientKeyFromHeaders } from '@/lib/ratelimit';
import { saveReport, storeStatus } from '@/lib/store';
import { findDemoCase } from '@/lib/demo/cases';
import { getCurrentUser } from '@/lib/supabase/auth-server';

export const runtime = 'nodejs';
export const maxDuration = 45;
/** Analysis depends on live network state, so never cache a response. */
export const dynamic = 'force-dynamic';

const Body = z.object({
  text: z.string().max(MAX_INPUT_LENGTH + 1_000).optional(),
  kind: z.enum(['auto', 'message', 'url', 'claim']).default('auto'),
  context: z.enum(['generic', 'bank_scam', 'job_offer', 'invoice', 'proposal', 'website']).default('generic'),
  liveChecks: z.boolean().default(true),
  demoSlug: z.string().max(64).optional(),
});

function fail(message: string, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function POST(request: Request) {
  const limit = checkRateLimit(clientKeyFromHeaders(request.headers));
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit reached (${limit.limit} analyses per minute). Try again in ${limit.retryAfterSeconds} seconds.`,
      },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return fail('The request body must be valid JSON.', 400);
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return fail('The request body did not match the expected shape.', 400);
  }

  const { kind, liveChecks, demoSlug } = parsed.data;
  let context = parsed.data.context;

  // A demo slug loads server-side canned text so the UI cannot pass off
  // arbitrary input as a curated example.
  let text = parsed.data.text ?? '';
  let isDemo = false;
  let effectiveKind = kind;
  if (demoSlug) {
    const demo = findDemoCase(demoSlug);
    if (!demo) return fail('That example does not exist.', 404);
    text = demo.text;
    effectiveKind = demo.kind;
    context = demo.context;
    isDemo = true;
  }

  const validated = validateInput(text);
  if (!validated.ok) {
    return fail(validated.error.message, 400, { code: validated.error.code });
  }

  try {
    const report = await analyze({
      text: validated.value,
      kind: effectiveKind,
      context,
      liveChecks,
      isDemo,
    });

    const store = storeStatus();
    let storageNote: string | undefined;
    if (store.enabled) {
      /**
       * Ownership comes from the session cookie, never from the request body.
       * Accepting a client-supplied user id would let anyone write reports
       * into someone else's account.
       */
      const user = await getCurrentUser();
      const result = await saveReport(report, user?.id ?? null);
      report.persisted = result.saved;
      if (!result.saved) storageNote = result.reason;
    } else {
      report.persisted = false;
      storageNote = store.reason;
    }

    return NextResponse.json(
      { report, storageNote },
      { headers: { 'Cache-Control': 'no-store', 'X-RateLimit-Remaining': String(limit.remaining) } },
    );
  } catch (err) {
    // Log a short, non-sensitive marker. Never log the analysed content.
    console.error('[trustlens] analysis failed:', err instanceof Error ? err.message.slice(0, 160) : 'unknown');
    return fail('The analysis could not be completed. Nothing was saved. Please try again.', 500);
  }
}
