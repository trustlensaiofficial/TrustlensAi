/**
 * Auth configuration.
 *
 * Sign-in is Google OAuth and passkeys only — there is deliberately no
 * email/password path, so there is no password to phish, reuse or leak. That
 * is a defensible stance for a product whose subject is credential theft.
 */

/** Public Supabase values. Safe for the browser by design. */
export function publicSupabase(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) return null;
  return { url, key };
}

/**
 * Absolute site origin used to build the OAuth callback.
 *
 * Derived from configuration and never from a request header or user input:
 * an attacker-controlled Host would otherwise let us mint a callback pointing
 * at their domain. Falls back to the Vercel-provided URL, then localhost.
 */
export function siteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`;
  return 'http://localhost:3000';
}

/**
 * Only same-origin, path-style redirects are allowed after sign-in.
 *
 * Accepting an arbitrary `next` is the classic open-redirect: a login link
 * that bounces the user to an attacker's lookalike immediately after they
 * authenticate. `//evil.com` and `/\evil.com` are both rejected because
 * browsers treat them as protocol-relative URLs.
 */
export function safeNextPath(raw: string | null | undefined, fallback = '/analyze'): string {
  if (!raw) return fallback;
  const value = raw.trim();
  if (!value.startsWith('/')) return fallback;
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback;
  if (value.includes('://')) return fallback;
  return value;
}
