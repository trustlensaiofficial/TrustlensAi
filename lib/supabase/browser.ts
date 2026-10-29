'use client';

import { createBrowserClient } from '@supabase/ssr';
import { publicSupabase } from '../auth/config';

/**
 * Browser Supabase client, used only for auth.
 *
 * Carries the publishable key, which is designed to be public: every table
 * denies the browser role, so this client can authenticate a user and read
 * nothing else.
 */
let cached: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserSupabase() {
  const config = publicSupabase();
  if (!config) return null;
  cached ??= createBrowserClient(config.url, config.key);
  return cached;
}
