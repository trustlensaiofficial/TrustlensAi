import Link from 'next/link';
import Image from 'next/image';
import { Nav } from './Nav';
import { ThemeToggle } from './ThemeToggle';
import { AccountLink } from '../auth/AccountLink';

/**
 * The one page template. Every route renders through it, so the product reads
 * as one application rather than a set of screens.
 */
export function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <Link href="/" className="brand" aria-label="TrustLens AI — protection home">
            <Image src="/logo-mark.png" alt="" width={564} height={472} priority className="brand-mark" />
            <span className="brand-word">TrustLens<span className="brand-ai"> AI</span></span>
          </Link>
          <Nav />
          <div className="header-end">
            <AccountLink />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className={wide ? '' : 'shell'}>{children}</main>

      <footer className="site-footer">
        <div className="shell site-footer-inner">
          <span>TrustLens AI · Team Reshiram · DEX26223</span>
          <span>Evidence-first analysis. Never a guarantee that something is genuine.</span>
        </div>
      </footer>
    </>
  );
}
