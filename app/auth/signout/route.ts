import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/auth-server';
import { siteOrigin } from '@/lib/auth/config';

export const dynamic = 'force-dynamic';

/**
 * Sign-out is POST-only: a GET would let any page log a user out with an
 * <img> tag, which is a small but real CSRF.
 */
export async function POST() {
  const supabase = await getServerSupabase();
  if (supabase) await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/', siteOrigin()), { status: 303 });
}
