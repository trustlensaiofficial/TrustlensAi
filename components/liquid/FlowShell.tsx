import { LiquidStage } from './LiquidStage';
import { LiquidDock } from './LiquidDock';
import { SiteFooter, SiteHeader } from '../SiteHeader';

/**
 * The page template for the cinematic flow.
 *
 * Same parts as AppShell — stage, glass header, floating dock, footer — but
 * inside `.lq`, which holds the film grade so these pages stay dark whatever
 * the theme. The two shells exist so the grade is opt-in, not so the pages
 * can drift apart.
 */
export function FlowShell({
  children,
  className,
  /** The opening suppresses it: its animated mark is the brand moment. */
  withHeader = true,
}: {
  children: React.ReactNode;
  className?: string;
  withHeader?: boolean;
}) {
  return (
    <div className="lq">
      <LiquidStage />
      {withHeader && <SiteHeader />}
      <main className={['lq-main', 'dock-gap', className ?? ''].filter(Boolean).join(' ')}>
        {children}
      </main>
      <SiteFooter />
      <LiquidDock />
    </div>
  );
}
