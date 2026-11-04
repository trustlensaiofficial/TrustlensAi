'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Lens, Lock, Shield, Users } from './icons';

const ITEMS = [
  { href: '/', label: 'Protection', icon: <Shield /> },
  { href: '/check', label: 'Check', icon: <Lens /> },
  { href: '/alerts', label: 'Scam alerts', icon: <Users /> },
  { href: '/activity', label: 'Activity', icon: <Bell /> },
  { href: '/privacy', label: 'Privacy', icon: <Lock /> },
];

/**
 * The one navigation. `aria-current` carries the active state so the styling
 * and the accessible name cannot disagree. It scrolls horizontally on narrow
 * screens rather than hiding, because there is no second menu to fall back on.
 */
export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="nav" aria-label="Primary">
      {ITEMS.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className="nav-link" aria-current={active ? 'page' : undefined}>
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
