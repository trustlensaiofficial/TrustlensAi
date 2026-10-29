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
 *
 * The entry screens opt out of the chrome entirely. A navigation bar on the
 * opening competes with the one thing that screen is asking you to do, and
 * offering shortcuts past a sign-in before anyone has started is noise. The
 * dock appears once you are inside the product.
 */
export function FlowShell({
  children,
  className,
  /** The opening suppresses it: its animated mark is the brand moment. */
  withHeader = true,
  /** Entry screens (the opening, sign-in) suppress the navigation. */
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
        className={['lq-main', withDock ? 'dock-gap' : '', className ?? '']
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </main>
      {withDock && <SiteFooter />}
      {withDock && <LiquidDock />}
    </div>
  );
}
