import Link from 'next/link';
import { FloatingUtilityPanel } from './FloatingUtilityPanel';
import { Logo } from '../brand/Logo';

/** Shared product shell: quiet brand header, focused content and compact utilities. */
export function Shell({ children, wide, showUtilities = true }: { children: React.ReactNode; wide?: boolean; showUtilities?: boolean }) {
  return (
    <>
      <header className="site-header product-header">
        <div className="site-header-inner product-header-inner">
          <Link href="/home" aria-label="TrustLens AI home">
            <Logo size={30} />
          </Link>
          <span className="product-header-status"><span /> Your digital safety space</span>
        </div>
      </header>
      {showUtilities && <FloatingUtilityPanel />}
      <main className={wide ? '' : 'shell'}>{children}</main>
      <footer className="site-footer product-footer">
        <div className="shell site-footer-inner">
          <span>TrustLens AI · Pause. Verify. Then act.</span>
          <span>Evidence-first protection. No result is a guarantee of safety.</span>
        </div>
      </footer>
    </>
  );
}
