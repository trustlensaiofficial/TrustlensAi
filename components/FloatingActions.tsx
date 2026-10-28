'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChecklistIcon, ClockIcon, HelpIcon, LensIcon, PlusIcon } from './icons';

export interface FloatingAction {
  id: string;
  label: string;
  icon: 'new' | 'history' | 'checklist' | 'help' | 'analyze';
  href?: string;
  onSelect?: () => void;
}

const ICONS = {
  new: PlusIcon,
  history: ClockIcon,
  checklist: ChecklistIcon,
  help: HelpIcon,
  analyze: LensIcon,
} as const;

/**
 * One floating action menu for the whole app, given only the actions that make
 * sense on the current page. Every entry navigates or does something real —
 * there are no decorative controls here.
 */
export function FloatingActions({ actions }: { actions: FloatingAction[] }) {
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

  const run = useCallback(
    (action: FloatingAction) => {
      setOpen(false);
      if (action.onSelect) {
        action.onSelect();
        return;
      }
      if (action.href) {
        if (action.href.startsWith('#')) {
          document.querySelector(action.href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          router.push(action.href);
        }
      }
    },
    [router],
  );

  if (actions.length === 0) return null;

  return (
    <div className="fab-wrap" ref={wrapRef}>
      {open && (
        <div className="fab-menu" role="menu" aria-label="Quick actions">
          {actions.map((action, i) => {
            const Icon = ICONS[action.icon];
            return (
              <button
                key={action.id}
                type="button"
                role="menuitem"
                className="fab-item"
                style={{ animationDelay: `${i * 35}ms` }}
                onClick={() => run(action)}
              >
                <Icon />
                {action.label}
              </button>
            );
          })}
        </div>
      )}
      <button
        ref={toggleRef}
        type="button"
        className="fab-toggle"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={open ? 'Close quick actions' : 'Open quick actions'}
        onClick={() => setOpen((v) => !v)}
      >
        <PlusIcon />
      </button>
    </div>
  );
}
