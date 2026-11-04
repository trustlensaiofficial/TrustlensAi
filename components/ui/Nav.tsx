'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Lens, Lock, Play, Shield, Users } from './icons';
import './Nav.css';

const ITEMS = [
  { href: '/home', label: 'Protection', description: 'Your safety overview', icon: <Shield /> },
  { href: '/check', label: 'Check a message', description: 'Investigate a message, link or request', icon: <Lens /> },
  { href: '/story', label: 'How it works', description: 'See how TrustLens investigates', icon: <Play /> },
  { href: '/alerts', label: 'Scam alerts', description: 'Review example campaigns', icon: <Users /> },
  { href: '/activity', label: 'Activity', description: 'Open your recent checks', icon: <Bell /> },
  { href: '/privacy', label: 'Privacy & permissions', description: 'Understand your choices and controls', icon: <Lock /> },
];

/** One accessible, centred navigation panel for every viewport. */
export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key === 'Tab') {
        const items = panelRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
        if (!items?.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <div className="nav-menu">
      <button ref={triggerRef} type="button" className="nav-trigger"
        aria-haspopup="dialog" aria-expanded={open} aria-controls="trustlens-navigation-panel"
        onClick={() => setOpen((value) => !value)}>
        <span className={'nav-trigger-icon' + (open ? ' is-open' : '')} aria-hidden="true">
          <span /><span /><span />
        </span>
        <span>{open ? 'Close menu' : 'Menu'}</span>
      </button>
      {open && <>
        <button type="button" className="nav-backdrop" aria-label="Close navigation menu" onClick={() => setOpen(false)} />
        <section ref={panelRef} id="trustlens-navigation-panel" className="nav-panel" role="dialog"
          aria-modal="true" aria-labelledby="nav-panel-title">
          <div className="nav-panel-head">
            <div>
              <p className="nav-panel-eyebrow">TRUSTLENS AI</p>
              <h2 id="nav-panel-title">Where would you like to go?</h2>
              <p className="nav-panel-copy">Your protection tools, reports and privacy controls.</p>
            </div>
            <button type="button" className="nav-panel-close" onClick={() => setOpen(false)} aria-label="Close menu">×</button>
          </div>
          <nav className="nav-panel-grid" aria-label="Main navigation">
            {ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return <Link key={item.href} href={item.href} className={'nav-panel-link' + (active ? ' is-active' : '')}
                aria-current={active ? 'page' : undefined} onClick={() => setOpen(false)}>
                <span className="nav-panel-icon" aria-hidden="true">{item.icon}</span>
                <span className="nav-panel-text"><strong>{item.label}</strong><small>{item.description}</small></span>
                <span className="nav-panel-arrow" aria-hidden="true">→</span>
              </Link>;
            })}
          </nav>
          <div className="nav-panel-foot"><span>Evidence-first analysis</span><span>·</span><span>Your choices stay in your control</span></div>
        </section>
      </>}
    </div>
  );
}
