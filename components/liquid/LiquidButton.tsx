'use client';

import Link from 'next/link';
import { useCallback } from 'react';

type Variant = 'primary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Common {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
}

/**
 * Pointer tilt, written straight to the element.
 *
 * The rotation is a style mutation, not application state: putting it in
 * React state would re-render the tree on every pointer move for a value
 * only CSS consumes. The element comes from `currentTarget` rather than a
 * ref, so there is nothing to keep in sync and nothing to read during
 * render. `.lq-btn-face` caps the rotation at 7deg, so the face never
 * detaches from its shadow.
 */
function useTilt() {
  const onPointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return;
    const node = event.currentTarget;
    const box = node.getBoundingClientRect();
    if (!box.width || !box.height) return;
    node.style.setProperty('--mx', String(((event.clientX - box.left) / box.width - 0.5) * 2));
    node.style.setProperty('--my', String(((event.clientY - box.top) / box.height - 0.5) * 2));
  }, []);

  const onPointerLeave = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const node = event.currentTarget;
    node.style.setProperty('--mx', '0');
    node.style.setProperty('--my', '0');
  }, []);

  return { onPointerMove, onPointerLeave };
}

function classes(variant: Variant, size: Size, extra?: string) {
  return ['lq-btn', `lq-btn-${variant}`, size === 'md' ? '' : `lq-btn-${size}`, extra ?? '']
    .filter(Boolean)
    .join(' ');
}

function Face({ children }: { children: React.ReactNode }) {
  return (
    <span className="lq-btn-face">
      <span className="lq-btn-sheen" aria-hidden="true" />
      {children}
    </span>
  );
}

export function LiquidButton({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const tilt = useTilt();
  return (
    <button {...rest} {...tilt} className={classes(variant, size, className)}>
      <Face>{children}</Face>
    </button>
  );
}

export function LiquidLink({
  children,
  href,
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: Common & { href: string } & Omit<React.ComponentProps<typeof Link>, 'href' | 'className'>) {
  const tilt = useTilt();
  return (
    <Link {...rest} {...tilt} href={href} className={classes(variant, size, className)}>
      <Face>{children}</Face>
    </Link>
  );
}
