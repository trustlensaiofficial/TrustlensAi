import Image from 'next/image';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { AccountLink } from './auth/AccountLink';
import { NavRail } from './NavRail';

/**
 * Brand lockup: the official mark plus a live-text wordmark.
 * The global controls own navigation and appearance on every route.
 */
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="TrustLens AI — home">
      <Image
        src="/logo-mark.png"
        alt=""
        width={141}
        height={118}
        priority
        className="brand-logo"
      />
      <span className="brand-word">
        TrustLens <span className="brand-accent">AI</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Brand />
        <div className="header-actions">
          <NavRail />
          <AccountLink />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer shell">
      <span>TrustLens AI · Team Reshiram · DEX26223</span>
      <span>Evidence-first analysis. Never a guarantee of authenticity.</span>
    </footer>
  );
}
