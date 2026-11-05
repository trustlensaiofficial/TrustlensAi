'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { Book, Close, Home, Lifebuoy, List, Lock, Spark, Sun, User } from './icons';
import { useT } from '@/components/i18n/LocaleProvider';
import { LanguagePicker } from '@/components/i18n/LanguagePicker';
import type { DictKey } from '@/lib/i18n';
import './UtilityDock.css';

/**
 * The one floating control.
 *
 * Before this there were three things floating over the product at once — a
 * header "Quick tools" button, a bottom-right utility dock and Kaval's own
 * FAB — and on a 375px screen two of them sat on top of the content and each
 * other. A product that needs three floating menus does not have a navigation
 * problem, it has a decision problem.
 *
 * So: one dock, holding the four things that are not checks — the assistant,
 * the account, the settings, and the way to understand what the product does.
 * Navigation to a check happens from the dashboard's cards, where the choice
 * has room to be explained. Nothing here is a feature in disguise.
 *
 * Positioned bottom-centre on a phone, where a thumb already rests, and
 * bottom-right on a desktop, out of the reading column.
 */

interface Row {
  href: string;
  /** Translation keys, not English — the dock changes language with the rest. */
  label: DictKey;
  hint: DictKey;
  icon: React.ReactNode;
}

const ROWS: Row[] = [
  { href: '/account', label: 'dock.account', hint: 'dock.accountHint', icon: <User /> },
  { href: '/privacy', label: 'dock.privacy', hint: 'dock.privacyHint', icon: <Lock /> },
  { href: '/story', label: 'dock.story', hint: 'dock.storyHint', icon: <Book /> },
];

export function UtilityDock() {
  const t = useT();
  /*
   * The route the dock was opened on, or null when closed.
   *
   * Derived rather than reset from an effect. Closing on navigation by calling
   * setState inside useEffect costs a second render on every route change, and
   * React 19 flags it for exactly that reason; comparing against the current
   * path answers the same question during the render that has to happen anyway.
   */
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const pathname = usePathname();
  const open = openedOn !== null && openedOn === pathname;

  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();

  const close = useCallback(() => {
    setOpenedOn(null);
    // Focus returns to where it left, or a keyboard user is dropped at the top
    // of the document with no idea what just happened.
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab') return;

      // Queried per keypress rather than cached: the list is short, and a
      // cached list goes stale the moment anything inside re-renders.
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const raf = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>('a[href], button')?.focus();
    });

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
      cancelAnimationFrame(raf);
    };
  }, [open, close]);

  const atHome = pathname === '/home';

  return (
    <>
      {open && <div className="dock-scrim" onClick={close} role="presentation" />}

      <div className={`dock${open ? ' is-open' : ''}`}>
        {open && (
          <div
            ref={panelRef}
            className="dock-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="dock-head">
              <h2 id={titleId}>{t('dock.title')}</h2>
              <button type="button" className="dock-x" onClick={close} aria-label={t('common.close')}>
                <Close />
              </button>
            </div>

            {/* The assistant leads, because it is the only thing here someone
                reaches for mid-task rather than once. */}
            <button
              type="button"
              className="dock-kaval"
              onClick={() => {
                // Kaval listens for this rather than being navigated to, so
                // asking about a report never costs you the report.
                window.dispatchEvent(new Event('trustlens:open-kaval'));
                close();
              }}
            >
              <span className="dock-kaval-icon" aria-hidden="true"><Spark /></span>
              <span className="dock-row-text">
                <strong>{t('dock.kaval')}</strong>
                <small>{t('dock.kavalHint')}</small>
              </span>
            </button>

            <ul className="dock-rows">
              {!atHome && (
                <li>
                  <Link href="/home" className="dock-row">
                    <span className="dock-row-icon" aria-hidden="true"><Home /></span>
                    <span className="dock-row-text">
                      <strong>{t('dock.dashboard')}</strong>
                      <small>{t('dock.dashboardHint')}</small>
                    </span>
                  </Link>
                </li>
              )}
              {ROWS.map((row) => (
                <li key={row.href}>
                  <Link href={row.href} className="dock-row">
                    <span className="dock-row-icon" aria-hidden="true">{row.icon}</span>
                    <span className="dock-row-text">
                      <strong>{t(row.label)}</strong>
                      <small>{t(row.hint)}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="dock-setting">
              <span className="dock-row-icon" aria-hidden="true"><Sun /></span>
              <span className="dock-row-text">
                <strong>{t('dock.appearance')}</strong>
                <small>{t('dock.appearanceHint')}</small>
              </span>
              <ThemeToggle />
            </div>

            <LanguagePicker />

            {/* The one number worth having in reach from every screen. */}
            <a className="dock-sos" href="tel:1930">
              <Lifebuoy />
              <span>
                <strong>{t('dock.sos')}</strong>
                <small>{t('dock.sosHint')}</small>
              </span>
            </a>
          </div>
        )}

        <button
          ref={triggerRef}
          type="button"
          className="dock-trigger"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpenedOn((v) => (v === null ? pathname : null))}
        >
          {open ? <Close /> : <List />}
          <span>{open ? t('dock.close') : t('dock.open')}</span>
        </button>
      </div>
    </>
  );
}

/** Kept so the dock's two settings rows can be reused on the settings page. */
export const DOCK_ROWS = ROWS;
