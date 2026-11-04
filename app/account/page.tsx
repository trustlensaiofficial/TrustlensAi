import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Shell } from '@/components/ui/Shell';
import { ActivityList } from '@/components/ui/ActivityList';
import { getCurrentUser } from '@/lib/supabase/auth-server';
import { Arrow, Check, Lock, Shield } from '@/components/ui/icons';

export const metadata: Metadata = { title: 'Your account', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await getCurrentUser();
  // Authorisation is decided here, on the server — never from a browser claim.
  if (!user) redirect('/login?next=%2Faccount');

  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email ??
    'Signed in';

  return (
    <Shell>
      <div className="page">
        <header className="page-head">
          <span className="chip chip-accent"><Shield /> Account</span>
          <h1>{name}</h1>
          {user.email && <p className="lede">{user.email}</p>}
        </header>

        <section className="section">
          <div className="grid grid-2">
            <div className="card card-pad">
              <h3 className="col-head"><Check /> Signed in</h3>
              <p className="muted-xs" style={{ marginTop: 8 }}>
                Reports you run while signed in are saved to your account as well as this device.
              </p>
            </div>
            <div className="card card-pad">
              <h3 className="col-head"><Lock /> Sign out</h3>
              <p className="muted-xs" style={{ margin: '8px 0 12px' }}>
                Ends the session on this device. Reports already saved here stay in this browser.
              </p>
              {/* POST, so a prefetch or a crafted link can never sign you out. */}
              <form action="/auth/signout" method="post">
                <button type="submit" className="btn btn-danger btn-sm">Sign out</button>
              </form>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>Your checks on this device</h2>
            <p>Stored in this browser. Deleting here removes them immediately.</p>
          </div>
          <ActivityList />
        </section>

        <div className="check-actions" style={{ marginTop: 'var(--s6)' }}>
          <Link href="/check" className="btn btn-primary">Check something <Arrow /></Link>
        </div>
      </div>
    </Shell>
  );
}
