import Link from 'next/link';
import { LensIcon } from './icons';
import { ThemeToggle } from './ThemeToggle';

/**
 * Temporary text-based identity. Replace `brand-mark` and the wordmark with
 * the official logo when it is supplied — nothing else depends on it.
 */
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="TrustLens AI — home">
      <span className="brand-mark" aria-hidden="true"><LensIcon /></span>
      <span>
        TrustLens <span className="brand-accent">AI</span>
      </span>
    </Link>
  );
}

export function SiteHeader({ current }: { current?: 'analyze' | 'history' }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Brand />
        <nav className="nav" aria-label="Main">
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
