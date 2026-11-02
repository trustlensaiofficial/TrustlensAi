import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/auth-server';
import { listReportsForUser, storeStatus } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Account-history endpoint.
 *
 * Authentication is verified on the server. The user id is derived only
 * from the verified Supabase session, never from query parameters or JSON.
 * The store applies a mandatory user_id filter and fails closed.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Sign in to view reports saved to your account.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const storage = storeStatus();
  if (!storage.enabled) {
    return NextResponse.json(
      { error: storage.reason ?? 'Account history is not configured.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const result = await listReportsForUser(user.id, 100);
  if (result.reason) {
    return NextResponse.json(
      { error: result.reason },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return NextResponse.json(
    { reports: result.reports },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
