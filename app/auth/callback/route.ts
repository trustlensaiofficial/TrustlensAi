import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/auth-server';
import { safeNextPath, siteOrigin } from '@/lib/auth/config';

export const dynamic = 'force-dynamic';

/**
 * OAuth callback: exchanges the one-time PKCE code for a session.
 *
 * The redirect target is validated to a same-origin path, so a crafted
 * callback link cannot bounce a freshly authenticated user to an attacker's
 * lookalike page. Provider errors are surfaced on the login screen rather
 * than dumped to the user as a stack trace.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeNextPath(url.searchParams.get('next'));
  const origin = siteOrigin();

  const providerError = url.searchParams.get('error_description') ?? url.searchParams.get('error');
  if (providerError) {
    const to = new URL('/login', origin);
    // The provider's text can contain arbitrary content; cap it.
    to.searchParams.set('error', providerError.slice(0, 180));
    return NextResponse.redirect(to);
  }

  if (!code) {
    const to = new URL('/login', origin);
    to.searchParams.set('error', 'The sign-in link was incomplete. Please try again.');
    return NextResponse.redirect(to);
  }

  const supabase = await getServerSupabase();
  if (!supabase) {
    const to = new URL('/login', origin);
    to.searchParams.set('error', 'Sign-in is not configured on this deployment.');
    return NextResponse.redirect(to);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const to = new URL('/login', origin);
    to.searchParams.set('error', 'That sign-in link could not be completed. Please try again.');
    return NextResponse.redirect(to);
  }

  return NextResponse.redirect(new URL(next, origin));
}
