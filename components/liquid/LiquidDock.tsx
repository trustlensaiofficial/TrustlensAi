'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChecklistIcon, ClockIcon, LensIcon, SearchIcon } from '../icons';

interface DockItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

/*
 * Destinations only. "/" is the opening sequence, not somewhere you navigate
 * back to mid-session — the brand lockup in the header already leads there.
 */
const ITEMS: DockItem[] = [
  { href: '/story', label: 'Story', icon: <LensIcon /> },
  { href: '/features', label: 'Features', icon: <ChecklistIcon /> },
  { href: '/analyze', label: 'Analyse', icon: <SearchIcon /> },
  { href: '/history', label: 'History', icon: <ClockIcon /> },
];

/**
 * The floating menu.
 *
 * `aria-current` carries the active state rather than a class, so the styling
 * and the accessible name cannot disagree about which page you are on.
 */
export function LiquidDock() {
  const pathname = usePathname();

  return (
    <nav className="lq-dock" aria-label="Primary">
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="lq-dock-item"
            aria-current={active ? 'page' : undefined}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
