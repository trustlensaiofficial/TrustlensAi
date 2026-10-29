'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

const LINKS = [
  { href: '/', label: 'Home', detail: 'Opening' },
  { href: '/story', label: 'Story', detail: 'Understand the idea' },
  { href: '/features', label: 'Features', detail: 'Explore the prototype' },
  { href: '/analyze', label: 'Analyse', detail: 'Check something suspicious' },
  { href: '/history', label: 'History', detail: 'Your recent checks' },
  { href: '/qa', label: 'Testing', detail: 'Run product checks' },
  { href: '/account', label: 'Account', detail: 'Sign-in and saved reports' },
];

export function GlobalControls() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <div className="global-controls" aria-label="Site controls">
        <button
          type="button"
          className="global-menu-trigger"
          aria-expanded={open}
          aria-controls="global-navigation-panel"
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={open ? 'global-menu-glyph is-open' : 'global-menu-glyph'} aria-hidden="true">
            <span />
            <span />
          </span>
          <span>{open ? 'Close' : 'Explore'}</span>
        </button>
        <div className="global-theme-control" aria-label="Appearance">
          <ThemeToggle />
        </div>
      </div>

      <button
        type="button"
        className={open ? 'global-nav-backdrop is-open' : 'global-nav-backdrop'}
        aria-label="Close navigation menu"
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
      />
      <aside
        id="global-navigation-panel"
        className={open ? 'global-nav-panel is-open' : 'global-nav-panel'}
        aria-label="Main navigation"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="global-nav-heading">
          <span className="global-nav-eyebrow">TRUSTLENS AI</span>
          <h2>Where to next?</h2>
          <p>One menu. Every part of the prototype.</p>
        </div>
        <nav className="global-nav-links">
          {LINKS.map((item, index) => {
            const active = item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? 'global-nav-link is-active' : 'global-nav-link'}
                aria-current={active ? 'page' : undefined}
                onClick={() => setOpen(false)}
                style={{ '--nav-delay': `${index * 45}ms` } as React.CSSProperties}
                tabIndex={open ? 0 : -1}
              >
                <span className="global-nav-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="global-nav-copy">
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </span>
                <span className="global-nav-arrow" aria-hidden="true">↗</span>
              </Link>
            );
          })}
        </nav>
        <div className="global-nav-foot">
          <span className="global-status-dot" />
          Evidence-first analysis · Never a guarantee of authenticity
        </div>
      </aside>
    </>
  );
}
