import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SignIn } from '@/components/auth/SignIn';
import { OpeningScene } from '@/components/opening/OpeningScene';
import { Arrow } from '@/components/ui/icons';
import { getCurrentUser } from '@/lib/supabase/auth-server';
import { safeNextPath } from '@/lib/auth/config';
import '../opening.css';
import './login.css';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in with Google or a passkey to keep your reports across devices.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Sign in.
 *
 * No shell: the header, the utility dock and the footer all belong to the
 * signed-in product, and showing them around a sign-in form offers a dozen
 * ways to wander off at the one moment the screen is asking for a decision.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next, '/home');
  // Already signed in: continue rather than showing a dead end.
  if (await getCurrentUser()) redirect(next);

  return (
    <div className="auth">
      <OpeningScene />
      <SignIn next={next} initialError={params.error?.slice(0, 180)} />
      <Link href="/" className="auth-back">
        <Arrow /> Back
      </Link>
    </div>
  );
}
