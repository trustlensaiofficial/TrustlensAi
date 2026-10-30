import { SiteFooter, SiteHeader } from './SiteHeader';

/**
 * The one page template.
 *
 * Every route renders through this: the same aurora ground (painted on the
 * body), the same floating glass header and the same footer, so the
 * cinematic flow and the product read as one application.
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
      <main className={[wide ? '' : 'shell', className ?? ''].filter(Boolean).join(' ')}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
