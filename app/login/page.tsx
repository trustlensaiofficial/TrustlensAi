import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SiteFooter, SiteHeader } from '@/components/SiteHeader';
import { SignInPanel } from '@/components/auth/SignInPanel';
import { AlertIcon } from '@/components/icons';
import { getCurrentUser } from '@/lib/supabase/auth-server';
import { safeNextPath } from '@/lib/auth/config';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to TrustLens AI with Google or a passkey to save your reports.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const user = await getCurrentUser();
  // Already signed in: skip the form rather than showing a dead end.
  if (user) redirect(next);

  return (
    <>
      <SiteHeader />
      <main className="shell auth-shell">
        {params.error && (
          <div className="banner banner-error" style={{ marginBottom: 18 }} role="alert">
            <AlertIcon />
            <p>{params.error}</p>
          </div>
        )}
        <SignInPanel next={next} />
      </main>
      <SiteFooter />
    </>
  );
}
