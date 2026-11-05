import Link from 'next/link';
import Image from 'next/image';
import { FloatingUtilityPanel } from './FloatingUtilityPanel';

/** Shared product shell: quiet brand header, focused content and compact utilities. */
export function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <>
      <header className="site-header product-header">
        <div className="site-header-inner product-header-inner">
          <Link href="/home" className="brand" aria-label="TrustLens AI home">
            <Image src="/logo-mark.png" alt="" width={564} height={472} priority className="brand-mark" />
            <span className="brand-word">TrustLens<span className="brand-ai"> AI</span></span>
          </Link>
          <span className="product-header-status"><span /> Your digital safety space</span>
        </div>
      </header>
      <FloatingUtilityPanel />
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
