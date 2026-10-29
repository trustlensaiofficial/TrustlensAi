import Link from 'next/link';
import { BrandMark } from './BrandMark';
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
      <span className="brand-mark" aria-hidden="true">
        <BrandMark size={30} idSuffix="hdr" />
      </span>
      <span className="brand-full">
        TrustLens <span className="brand-accent">AI</span>
      </span>
    </Link>
  );
}

export function SiteHeader({ current }: { current?: 'analyze' | 'history' | 'showcase' }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Brand />
        <nav className="nav" aria-label="Main">
          <Link className="nav-link" href="/showcase" aria-current={current === 'showcase' ? 'page' : undefined}>
            Showcase
          </Link>
          <Link className="nav-link" href="/analyze" aria-current={current === 'analyze' ? 'page' : undefined}>
            Analyze
          </Link>
          <Link className="nav-link" href="/history" aria-current={current === 'history' ? 'page' : undefined}>
            History
          </Link>
          <ThemeToggle />
        </nav>
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
