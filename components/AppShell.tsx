import { LiquidDock } from './liquid/LiquidDock';
import { SiteFooter, SiteHeader } from './SiteHeader';

/**
 * The one page template.
 *
 * Every route renders through this: the same aurora ground (painted on the
 * body), the same floating glass header, the same floating dock and the same
 * footer. Pages used to come in two flavours — the cinematic flow had a dock
 * and the product had a header — which made them read as two different
 * applications.
 *
 * `main` carries `dock-gap` so content can always scroll clear of the
 * floating dock rather than ending underneath it.
 */
export function AppShell({
  children,
  className,
  wide,
}: {
  children: React.ReactNode;
  className?: string;
  /** Opt out of the centred reading column for full-bleed workspaces. */
  wide?: boolean;
}) {
  return (
    <>
      <SiteHeader />
      <main className={[wide ? '' : 'shell', 'dock-gap', className ?? ''].filter(Boolean).join(' ')}>
        {children}
      </main>
      <SiteFooter />
      <LiquidDock />
    </>
  );
}
