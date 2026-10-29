import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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
 * Uses getUser(), which validates the token against the auth server. getSession()
 * only decodes whatever cookie was sent and must never be the basis for an
 * authorisation decision.
 */
export async function getCurrentUser() {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}
