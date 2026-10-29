'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/story', label: 'Story' },
  { href: '/features', label: 'Features' },
  { href: '/analyze', label: 'Analyse' },
  { href: '/history', label: 'History' },
  { href: '/qa', label: 'Testing' },
];

/**
 * Primary navigation with an indicator that glides between items.
 *
 * Deliberately declarative: the nav is an equal-column grid, and the active
 * index is written as a custom property in the rendered markup, so the
 * indicator is positioned by CSS alone — `translateX(index * 100%)`.
 *
 * An earlier version measured the active link in an effect and wrote the
 * geometry back to the DOM. It was correct in principle and unreliable in
 * practice: the imperative styles raced the stylesheet and the pill stayed
 * collapsed. Deriving position from the route at render time removes the
 * measurement, the effect and the race together.
 */
export function NavRail({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const activeIndex = ITEMS.findIndex(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`),
  );

  return (
    <nav
      className="nav"
      aria-label="Main"
      data-active={activeIndex >= 0}
      style={
        {
          '--nav-count': ITEMS.length,
          '--nav-active': Math.max(activeIndex, 0),
        } as React.CSSProperties
      }
    >
      <span className="nav-indicator" aria-hidden="true" />
      {ITEMS.map((item) => {
        const active = activeIndex >= 0 && ITEMS[activeIndex]?.href === item.href;
        return (
          <Link
            key={item.href}
            className="nav-link"
            href={item.href}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
      {children}
    </nav>
  );
}
