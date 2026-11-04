import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  allActionStates,
  isUserActionState,
  recoveryPlanFor,
} from '@/lib/incident/recovery-plan';
import { clientKeyFromHeaders, consumeRateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  actionState: z.string().max(64),
});

/**
 * What to do now, for someone who has already acted.
 *
 * **Deliberately unauthenticated.** Someone whose money left their account
 * ten minutes ago must not meet a sign-in screen, and this endpoint reads
 * nothing and stores nothing — it maps a state the caller supplies onto fixed
 * guidance. Putting a login in front of the most urgent thing the product does
 * would be the worst possible place to ask for one.
 *
 * Rate limited anyway, more generously than analysis, because a person in this
 * situation may legitimately re-request a plan several times while they work
 * through it.
 */
export async function POST(request: Request) {
  const limit = await consumeRateLimit(`recovery:${clientKeyFromHeaders(request.headers)}`, {
    limit: 30,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${limit.retryAfterSeconds} seconds.` },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'The request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'An actionState is required.' }, { status: 400 });
  }

  const { actionState } = parsed.data;
  if (!isUserActionState(actionState)) {
    // Enumerate the valid values rather than only refusing: a client author
    // debugging this at 2am should not have to open the spec.
    return NextResponse.json(
      { error: 'That is not a recognised action state.', validValues: allActionStates() },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { recoveryPlan: recoveryPlanFor(actionState) },
    { headers: { 'Cache-Control': 'no-store', 'X-RateLimit-Scope': limit.scope } },
  );
}

/** The states a client can offer, mildest first. */
export async function GET() {
  return NextResponse.json(
    {
      actionStates: allActionStates(),
      note: 'Ordered by exposure, mildest first. A case keeps the furthest action reported, never the most recent one.',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
