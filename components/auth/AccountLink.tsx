'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { getAuthSnapshot, getServerAuthSnapshot, subscribeAuth } from '@/lib/auth/client-store';
import { UserIcon } from '../icons';

/**
 * Header account control.
 *
 * Shows the real session state and nothing decorative. While the session is
 * still being resolved it renders a neutral "Account" link rather than
 * guessing "Sign in" and flipping a moment later.
 */
export function AccountLink() {
  const auth = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerAuthSnapshot);

  const signedIn = auth.status === 'signed-in';
  const href = signedIn ? '/account' : '/login';
  const label = signedIn ? (auth.label ?? 'Account') : auth.status === 'unknown' ? 'Account' : 'Sign in';

  return (
    <Link className="btn btn-secondary account-link" href={href} title={auth.email ?? undefined}>
      <UserIcon />
      <span className="account-label">{label}</span>
    </Link>
  );
}
