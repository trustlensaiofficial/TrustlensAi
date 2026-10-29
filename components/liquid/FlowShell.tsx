import { LiquidStage } from './LiquidStage';
import { SiteFooter, SiteHeader } from '../SiteHeader';

/**
 * Cinematic page shell. The root layout provides the single shared navigation
 * and theme controls; this shell only owns the background, header and footer.
 */
export function FlowShell({
  children,
  className,
  withHeader = true,
  withDock = true,
}: {
  children: React.ReactNode;
  className?: string;
  withHeader?: boolean;
  /** Kept for existing call sites: false hides the footer on entry screens. */
  withDock?: boolean;
}) {
  return (
    <div className="lq">
      <LiquidStage />
      {withHeader && <SiteHeader />}
      <main className={['lq-main', className ?? ''].filter(Boolean).join(' ')}>
        {children}
      </main>
      {withDock && <SiteFooter />}
    </div>
  );
}
