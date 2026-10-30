import { GlassField } from './liquid/GlassField';
import { SiteFooter, SiteHeader } from './SiteHeader';

/**
 * Shared product shell. Navigation and appearance are mounted once in the
 * root layout, so the prototype has one consistent control surface.
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
      <GlassField />
      <SiteHeader />
      <main className={[wide ? '' : 'shell', className ?? ''].filter(Boolean).join(' ')}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
