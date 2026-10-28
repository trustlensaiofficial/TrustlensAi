import Link from 'next/link';
import { SiteFooter, SiteHeader } from '@/components/SiteHeader';
import { ArrowIcon, LensIcon } from '@/components/icons';

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section className="card empty" style={{ marginTop: 'clamp(32px, 6vw, 64px)' }}>
          <div className="empty-icon"><LensIcon /></div>
          <h2>That page does not exist</h2>
          <p>The address may be mistyped, or the page may have moved.</p>
          <div className="hero-actions" style={{ justifyContent: 'center', marginTop: 24 }}>
            <Link className="btn btn-primary" href="/analyze">
              Go to the workspace <ArrowIcon />
            </Link>
          </div>
        </section>
        <SiteFooter />
      </main>
    </>
  );
}
