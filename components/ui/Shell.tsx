import Link from 'next/link';
import { Logo } from '../brand/Logo';
import { Ground } from './Ground';
import { UtilityDock } from './UtilityDock';
import { OnlineBadge } from './OnlineBadge';

/**
 * The app shell.
 *
 * Deliberately almost nothing: the ground, a quiet brand bar, the content,
 * and one floating dock. There is no navigation strip, because the dashboard's
 * cards are the navigation and a second copy of them in a header is how a
 * phone screen ends up with the same six links twice.
 *
 * `showDock` exists for the screens that are a single decision — sign-in, the
 * opening — where a floating menu is just another way to leave.
 */
export function Shell({
  children,
  wide,
  showDock = true,
}: {
  children: React.ReactNode;
  wide?: boolean;
  showDock?: boolean;
}) {
  return (
    <>
      {/* Drawn once, behind everything, carrying no information. It exists so
          the glass has something to refract; without it every pane samples a
          flat colour and the depth system collapses into grey rectangles. */}
      <Ground />

      <header className="app-bar">
        <div className="app-bar-inner">
          <Link href="/home" className="app-bar-brand" aria-label="TrustLens AI — dashboard">
            <Logo size={28} />
          </Link>
          <OnlineBadge />
        </div>
      </header>

      <main className={wide ? 'app-main' : 'app-main shell'}>{children}</main>

      {showDock && <UtilityDock />}

      <footer className="app-foot">
        <div className="shell">
          <span>TrustLens AI · Team Reshiram · DEX26223</span>
          <span>Evidence-first analysis. Never a guarantee that something is genuine.</span>
        </div>
      </footer>
    </>
  );
}
