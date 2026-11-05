'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Help, Settings, Shield, Users, Spark, Close } from './icons';
import './FloatingUtilityPanel.css';

/** A compact, thumb-friendly utility dock; primary tools stay on the dashboard. */
export function FloatingUtilityPanel() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Reset transient panel state after navigation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  return (
    <div className="utility-dock">
      {open && (
        <>
          <button className="utility-dismiss" type="button" aria-label="Close quick tools" onClick={() => setOpen(false)} />
          <section className="utility-panel" aria-label="Quick tools">
            <div className="utility-panel-head">
              <span><span className="utility-kicker">TRUSTLENS AI</span><strong>Quick tools</strong></span>
              <button className="utility-close" type="button" aria-label="Close quick tools" onClick={() => setOpen(false)}><Close /></button>
            </div>
            <button className="utility-item utility-assistant" type="button" onClick={() => { if (window.location.pathname === '/home' || window.location.pathname === '/check') window.dispatchEvent(new Event('trustlens:open-kaval')); else window.location.href = '/home?assistant=1'; setOpen(false); }}>
              <span className="utility-icon"><Spark /></span><span><strong>Ask Kaval</strong><small>Understand a finding or next step</small></span>
            </button>
            <Link className="utility-item" href="/account">
              <span className="utility-icon"><Users /></span><span><strong>Profile & account</strong><small>Sign-in and passkey controls</small></span>
            </Link>
            <Link className="utility-item" href="/privacy">
              <span className="utility-icon"><Settings /></span><span><strong>Settings & privacy</strong><small>Data, permissions and choices</small></span>
            </Link>
            <Link className="utility-item" href="/respond">
              <span className="utility-icon"><Help /></span><span><strong>Help & urgent response</strong><small>What to do if something happened</small></span>
            </Link>
            <p className="utility-foot"><Shield /> Your protection stays in your control</p>
          </section>
        </>
      )}
      <button className={'utility-trigger' + (open ? ' is-open' : '')} type="button" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(value => !value)}>
        {open ? <Close /> : <Settings />}<span>{open ? 'Close' : 'Quick tools'}</span>
      </button>
    </div>
  );
}
