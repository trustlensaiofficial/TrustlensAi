import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { AddPasskeyButton } from '@/components/auth/AddPasskeyButton';
import { ArrowIcon, LogOutIcon, ShieldIcon, UserIcon } from '@/components/icons';
import { getCurrentUser } from '@/lib/supabase/auth-server';

export const metadata: Metadata = {
  title: 'Your account',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await getCurrentUser();
  // Server-side gate. The proxy refreshes the session; authorisation is decided here.
  if (!user) redirect('/login?next=%2Faccount');

  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email ??
    'Signed in';

  return (
    <AppShell>
        <section style={{ padding: 'clamp(28px, 4vw, 48px) 0 clamp(16px, 2.4vw, 24px)' }}>
          <p className="eyebrow"><span className="dot" /> Account</p>
          <h1 style={{ fontSize: 'clamp(28px, 3.6vw, 42px)', marginTop: 14 }}>{name}</h1>
          <p className="lede" style={{ marginTop: 14, maxWidth: '62ch' }}>
            Signed in with {user.app_metadata?.provider === 'google' ? 'Google' : 'a passkey'}.
            Reports you run while signed in are saved to your account.
          </p>
        </section>

        <div className="card card-pad" style={{ display: 'grid', gap: 18 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <UserIcon style={{ width: 18, height: 18, color: 'var(--accent)', flex: 'none', marginTop: 2 }} />
            <div>
              <strong style={{ fontSize: 14 }}>{user.email ?? 'No email on this account'}</strong>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4, lineHeight: 1.6 }}>
                Your reports are private to this account. No endpoint lists anyone else&apos;s.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <ShieldIcon style={{ width: 18, height: 18, color: 'var(--accent)', flex: 'none', marginTop: 2 }} />
            <div>
              <strong style={{ fontSize: 14 }}>Passkey</strong>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 12px', lineHeight: 1.6 }}>
                Add one and you can sign in on this device with Face ID, Touch ID or your screen
                lock — no password, and nothing a phishing page can capture.
              </p>
              <AddPasskeyButton />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
          <Link className="btn btn-primary" href="/analyze">Analyze something <ArrowIcon /></Link>
          <Link className="btn btn-secondary" href="/history">Your history</Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="btn btn-ghost"><LogOutIcon /> Sign out</button>
          </form>
        </div>

    </AppShell>
  );
}
