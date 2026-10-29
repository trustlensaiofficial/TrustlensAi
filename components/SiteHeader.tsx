import Image from 'next/image';
import Link from 'next/link';
import { AccountLink } from './auth/AccountLink';
import { NavRail } from './NavRail';
import { ThemeToggle } from './ThemeToggle';

/**
 * Brand lockup: the TrustLens mark plus the wordmark.
 *
 * The mark lives in public/logo-mark.svg. To swap in a different official
 * file, replace that asset (or change the `src` below) — no other component
 * reads it, and the wordmark is plain text so it stays crisp and themeable.
 */
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="TrustLens AI — home">
      {/* The supplied logo is a full lockup (mark + wordmark), so it stands
          alone here rather than sitting next to a duplicate text wordmark. */}
      <Image
        src="/logo-official.png"
        alt="TrustLens AI"
        width={132}
        height={97}
        priority
        className="brand-logo"
      />
    </Link>
  );
}

export function SiteHeader({ current }: { current?: 'analyze' | 'history' | 'showcase' }) {
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
