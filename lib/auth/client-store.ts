'use client';

import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { getBrowserSupabase } from '../supabase/browser';

/**
 * Browser-side auth state for header chrome.
 *
 * An external store rather than component state: the header renders inside
 * client pages, and reading auth in an effect would cause a cascading render
 * on every route. Session changes arrive through onAuthStateChange.
 *
 * This drives presentation only. Every protected route still verifies the
 * user on the server with getUser() — the header is an affordance, never an
 * authorisation decision.
 */
export interface AuthSnapshot {
  status: 'unknown' | 'signed-out' | 'signed-in';
  label: string | null;
  email: string | null;
}

const SIGNED_OUT: AuthSnapshot = { status: 'signed-out', label: null, email: null };
const UNKNOWN: AuthSnapshot = { status: 'unknown', label: null, email: null };

let snapshot: AuthSnapshot = UNKNOWN;
let started = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function setSnapshot(next: AuthSnapshot) {
  if (
    next.status === snapshot.status &&
    next.label === snapshot.label &&
    next.email === snapshot.email
  ) {
    return; // Reference stability: getSnapshot must not churn.
  }
  snapshot = next;
  emit();
}

function labelFor(user: User | null) {
  if (!user) return null;
  const full = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null;
  const name = typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : null;
  return (full ?? name)?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'Account';
}

function start() {
  if (started) return;
  started = true;
  const supabase = getBrowserSupabase();
  if (!supabase) {
    setSnapshot(SIGNED_OUT);
    return;
  }
  void supabase.auth
    .getUser()
    .then(({ data }: { data: { user: User | null } }) => {
      setSnapshot(
        data.user
          ? { status: 'signed-in', label: labelFor(data.user), email: data.user.email ?? null }
          : SIGNED_OUT,
      );
    })
    .catch(() => setSnapshot(SIGNED_OUT));

  supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
    const user = session?.user ?? null;
    setSnapshot(user ? { status: 'signed-in', label: labelFor(user), email: user.email ?? null } : SIGNED_OUT);
  });
}

export function subscribeAuth(onChange: () => void): () => void {
  listeners.add(onChange);
  start();
  return () => listeners.delete(onChange);
}

export function getAuthSnapshot(): AuthSnapshot {
  return snapshot;
}

export function getServerAuthSnapshot(): AuthSnapshot {
  return UNKNOWN;
}
