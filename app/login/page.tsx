import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LiquidStage } from '@/components/liquid/LiquidStage';
import { LiquidSignIn } from '@/components/auth/LiquidSignIn';
import { getCurrentUser } from '@/lib/supabase/auth-server';
import { safeNextPath } from '@/lib/auth/config';
import '../liquid.css';
import './login.css';

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
  const next = safeNextPath(params.next, '/story');
  const user = await getCurrentUser();
  // Already signed in: continue rather than showing a dead end.
  if (user) redirect(next);

  return (
    <div className="lq">
      <LiquidStage />
      <main className="lq-main">
        <LiquidSignIn next={next} initialError={params.error?.slice(0, 180)} />
      </main>
    </div>
  );
}
