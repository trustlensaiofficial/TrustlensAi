import Link from 'next/link';
import { getCurrentUser } from '@/lib/supabase/auth-server';
import { Shield } from '@/components/ui/icons';

/**
 * Shows who is signed in, or offers to sign in.
 *
 * A server component, so the signed-in state is correct in the first paint
 * rather than flickering in after hydration.
 */
export async function AccountLink() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link href="/login" className="btn btn-secondary btn-sm account-link">
        <Shield /> Sign in
      </Link>
    );
  }

  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email ??
    'Account';

  return (
    <Link href="/account" className="btn btn-secondary btn-sm account-link" title={name}>
      <span className="account-dot" aria-hidden="true" />
      <span className="account-name">{name.split(' ')[0]}</span>
    </Link>
  );
}
