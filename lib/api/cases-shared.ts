/**
 * Shared plumbing for the case routes.
 *
 * Pulled out so each route file is only its own validation and nothing else —
 * and so the auth check and the owner id are derived in exactly one place.
 * Case endpoints require an account, unlike analysis and recovery plans.
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/auth-server';
import { clientKeyFromHeaders, consumeRateLimit } from '@/lib/ratelimit';
import type { CaseResult } from '@/lib/cases/store';

export const CASE_RUNTIME = 'nodejs' as const;

/** Resolves the signed-in owner, or the response to return instead. */
export async function requireOwner(
  request: Request,
  bucket: string,
): Promise<{ ok: true; userId: string } | { ok: false; response: Response }> {
  const limit = await consumeRateLimit(`${bucket}:${clientKeyFromHeaders(request.headers)}`, {
    limit: 40,
  });
  if (!limit.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Too many requests. Try again in ${limit.retryAfterSeconds} seconds.` },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
      ),
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'Sign in to use cases.',
          // Said explicitly, because a 401 on one endpoint should not read as
          // "the product needs an account".
          note: 'Analyses and recovery plans do not require an account.',
        },
        { status: 401 },
      ),
    };
  }

  return { ok: true, userId: user.id };
}

/** Turns a store result into a response, preserving its own status. */
export function respond<T>(result: CaseResult<T>, key: string, status = 200): Response {
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: result.status });
  }
  return NextResponse.json({ [key]: result.value }, { status, headers: { 'Cache-Control': 'no-store' } });
}

/** Parses a JSON body, or returns the 400 to send instead. */
export async function readJson(
  request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'The request body must be valid JSON.' }, { status: 400 }),
    };
  }
}
