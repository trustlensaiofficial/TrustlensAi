import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Session refresh on navigation. (Next 16 names this `proxy`; it was
 * `middleware` in earlier versions.)
 *
 * Supabase access tokens are short-lived. Without this, a signed-in user's
 * session would quietly expire mid-visit and Server Components would start
 * seeing them as a guest. Refreshed cookies are written onto the response so
 * both the browser and the next server render observe the new session.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  // Auth is optional: with no Supabase configured the app still runs as a
  // guest-only product rather than failing every request.
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });

  // Touching getUser() is what performs the refresh. Its result is
  // deliberately unused here; authorisation happens in the routes.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  /**
   * Skip static assets and images — running auth on every chunk request would
   * add latency for no benefit.
   */
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|logo-.*|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)'],
};
