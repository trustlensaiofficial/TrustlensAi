import Image from 'next/image';
import Link from 'next/link';
import { AccountLink } from './auth/AccountLink';
import { NavRail } from './NavRail';
import { ThemeToggle } from './ThemeToggle';

/**
 * Brand lockup: the official mark plus a live-text wordmark.
 *
 * The supplied artwork is a full lockup whose wordmark is white, which
 * disappears against the light theme. public/logo-mark.png is that same file
 * with the wordmark cropped away, so the mark can sit on either background
 * and the name is rendered as text — crisp at any size, and themeable.
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

export function SiteHeader({ current }: { current?: 'analyze' | 'history' | 'story' }) {
  // `current` is kept for call-site compatibility; NavRail derives the active
  // item from the pathname so the indicator can never disagree with the route.
  void current;
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
