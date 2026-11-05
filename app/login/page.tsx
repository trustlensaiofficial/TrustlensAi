import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Shell } from '@/components/ui/Shell';
import { SignIn } from '@/components/auth/SignIn';
import { getCurrentUser } from '@/lib/supabase/auth-server';
import { safeNextPath } from '@/lib/auth/config';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in with Google or a passkey to keep your reports across devices.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

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
    <Shell showUtilities={false}>
      <div className="page signin-page">
        <SignIn next={next} initialError={params.error?.slice(0, 180)} />
      </div>
    </Shell>
  );
}
