import { NextResponse } from 'next/server';
import { listReportsForUser } from '@/lib/store';
import { getCurrentUser } from '@/lib/supabase/auth-server';
import { clientKeyFromHeaders, consumeRateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Returns only the signed-in user's account-synced reports. */
export async function GET(request: Request) {
  const limit = await consumeRateLimit(`account-history:${clientKeyFromHeaders(request.headers)}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in to view account-synced reports.' }, { status: 401 });
  }

  const result = await listReportsForUser(user.id);
  return NextResponse.json(
    { reports: result.reports, notice: result.reason ?? null },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
