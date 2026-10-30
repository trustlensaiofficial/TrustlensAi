import { LiquidStage } from './LiquidStage';
import { SiteFooter, SiteHeader } from '../SiteHeader';

/**
 * The page template for the cinematic flow.
 *
 * Same parts as AppShell — stage, glass header, footer — plus the aurora
 * stage. The two shells exist so the pages cannot drift apart.
 *
 * The entry screens opt out of the chrome. A navigation bar on the opening
 * competes with the one thing that screen asks you to do, and offering
 * shortcuts past a sign-in before anyone has started is noise.
 */
export function FlowShell({
  children,
  className,
  /** The opening suppresses it: its animated mark is the brand moment. */
  withHeader = true,
  /** Entry screens (the opening, sign-in) suppress the footer too. */
  withDock = true,
}: {
  children: React.ReactNode;
  className?: string;
  withHeader?: boolean;
  withDock?: boolean;
}) {
  return (
    <div className="lq">
      <LiquidStage />
      {withHeader && <SiteHeader />}
      <main
        className={['lq-main', className ?? '']
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </main>
      {withDock && <SiteFooter />}
    </div>
  );
}
