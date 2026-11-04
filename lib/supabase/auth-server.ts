import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';
import { publicSupabase } from '../auth/config';

/**
 * Cookie-aware server client.
 *
 * Sessions live in HTTP-only cookies rather than localStorage, so a script
 * injected into the page cannot read the token. Server Components cannot
 * always write cookies, which is why the write path is allowed to fail
 * quietly — the proxy refreshes the session on navigation instead.
 */
export async function getServerSupabase() {
  const config = publicSupabase();
  if (!config) return null;
  const store = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) store.set(name, value, options);
        } catch {
          // Read-only context; the proxy handles refresh.
        }
      },
    },
  });
}

/**
 * The verified current user, or null.
 *
 * Two session transports, because the product has two kinds of client.
 *
 *  1. **A cookie**, for the web app. HTTP-only, so a script injected into the
 *     page cannot read the token.
 *  2. **An `Authorization: Bearer` header**, for native clients. An Android
 *     app has no cookie jar for our origin, and without this every
 *     authenticated route answered it 401 — which meant the case endpoints
 *     could not be used from the phone at all. An end-to-end test against the
 *     running API is what found that; nothing in the unit suite could.
 *
 * Both paths use `getUser()`, which **validates** the token against the auth
 * server. `getSession()` only decodes whatever was sent, and a decoded JWT is
 * an assertion by the caller rather than evidence — it must never be the basis
 * for an authorisation decision. The bearer token is read from the header
 * only: never a query parameter, which would end up in logs and referrers,
 * and never the body.
 */
export async function getCurrentUser() {
  const config = publicSupabase();
  if (!config) return null;

  // The web client's cookie session takes precedence when present.
  const cookieClient = await getServerSupabase();
  if (cookieClient) {
    const { data, error } = await cookieClient.auth.getUser();
    if (!error && data.user) return data.user;
  }

  const bearer = await bearerToken();
  if (!bearer) return null;

  const plain = createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await plain.auth.getUser(bearer);
  if (error) return null;
  return data.user ?? null;
}

/** The bearer token from the request headers, if there is one. */
async function bearerToken(): Promise<string | null> {
  try {
    const store = await headers();
    const raw = store.get('authorization') ?? store.get('Authorization');
    const token = raw?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    return token && token.length > 0 ? token : null;
  } catch {
    // No request scope — a build-time or background call.
    return null;
  }
}
