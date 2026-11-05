import Link from 'next/link';
import { Back } from './icons';

/**
 * The header every feature screen wears.
 *
 * Three jobs, in order of how badly they were missing:
 *
 *   1. A way back. Arriving from a dashboard card left no route home but the
 *      browser's own back button — which does not exist in an installed PWA's
 *      standalone window, so someone could reach a check and be stranded on it.
 *
 *   2. Continuity. The card's icon and hue come with you, so the screen reads
 *      as the card opening rather than as an unrelated page loading.
 *
 *   3. One line of context, not a paragraph. The screens this replaces opened
 *      with six lines of explanation above the first control, which on a phone
 *      put the actual work below the fold.
 *
 * About the transition: this is a CSS entrance on arrival, not a shared-element
 * view transition. Next 16.4.2 ships no view-transition support and React does
 * not export ViewTransition in this build; driving `document.startViewTransition`
 * around an async `router.push` captures the "after" state before the router has
 * rendered it, which flashes. An entrance that actually works beats a
 * cross-fade that sometimes tears.
 */
export function ScreenHeader({
  title,
  lede,
  icon,
  hue,
  back = '/home',
  backLabel = 'Dashboard',
}: {
  title: string;
  /** One line. If it needs two, the screen needs a better title. */
  lede?: string;
  icon?: React.ReactNode;
  /** The originating card's hue, so the screen reads as that card opening. */
  hue?: string;
  back?: string;
  backLabel?: string;
}) {
  return (
    <header className="screen-head" style={hue ? ({ '--hue': hue } as React.CSSProperties) : undefined}>
      <Link href={back} className="screen-back">
        <Back />
        <span>{backLabel}</span>
      </Link>

      <div className="screen-title">
        {icon ? <span className="screen-icon" aria-hidden="true">{icon}</span> : null}
        <h1>{title}</h1>
      </div>

      {lede ? <p className="screen-lede">{lede}</p> : null}
    </header>
  );
}
