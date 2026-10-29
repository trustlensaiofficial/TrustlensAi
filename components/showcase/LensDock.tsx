'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChecklistIcon, ChevronRightIcon, ClockIcon, HelpIcon,
  LensIcon, PlusIcon, ShieldIcon,
} from '../icons';

export interface DockAction {
  id: string;
  label: string;
  icon: 'lens' | 'new' | 'checklist' | 'history' | 'help' | 'shield';
  href?: string;
  onSelect?: () => void;
}

const ICONS = {
  lens: LensIcon,
  new: PlusIcon,
  checklist: ChecklistIcon,
  history: ClockIcon,
  help: HelpIcon,
  shield: ShieldIcon,
} as const;

/**
 * LensDock — the showcase's single floating control.
 *
 * Takes only the actions valid for the current phase, so it never offers a
 * route to somewhere that does not exist yet. Closes on Escape (restoring
 * focus), on outside pointer-down, and after any selection.
 */
export function LensDock({ actions }: { actions: DockAction[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  const run = useCallback((action: DockAction) => {
    setOpen(false);
    if (action.onSelect) { action.onSelect(); return; }
    if (!action.href) return;
    if (action.href.startsWith('#')) {
      document.querySelector(action.href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      router.push(action.href);
    }
  }, [router]);

  if (actions.length === 0) return null;

  return (
    <div className="sc-dock" ref={wrapRef}>
      {open && (
        <div className="sc-dock-menu" role="menu" aria-label="LensDock actions">
          {actions.map((a, i) => {
            const Icon = ICONS[a.icon];
            return (
              <button
                key={a.id}
                type="button"
                role="menuitem"
                className="sc-dock-item"
                style={{ animationDelay: `${i * 32}ms` }}
                onClick={() => run(a)}
              >
                <Icon />
                {a.label}
              </button>
            );
          })}
        </div>
      )}
      <button
        ref={toggleRef}
        type="button"
        className="sc-dock-toggle"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={open ? 'Close LensDock' : 'Open LensDock'}
        onClick={() => setOpen((v) => !v)}
      >
        <LensIcon />
        LensDock
        <ChevronRightIcon className="sc-dock-chev" style={{ transform: 'rotate(-90deg)', width: 15, height: 15 }} />
      </button>
    </div>
  );
}
