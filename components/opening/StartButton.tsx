'use client';

import Link from 'next/link';
import { useCallback, useRef } from 'react';
import { LiquidButton } from '@/components/ui/liquid-glass-button';
import { Arrow } from '@/components/ui/icons';

/**
 * The Start control.
 *
 * `LiquidButton` supplies the glass — the refracted backdrop and the inset
 * rim lighting. What it does not supply is a response to being touched, and
 * on a phone that is the whole difference between a button that feels real
 * and a picture of one. So a ripple is added at the contact point.
 *
 * The ripple is created and removed directly on the node. Driving it through
 * React state would re-render the tree on every tap for an effect that lives
 * entirely on the compositor, and the cleanup would have to be a timer
 * against state that may already have changed.
 *
 * `asChild` is what makes it a real link: a button with an onClick that calls
 * router.push cannot be opened in a new tab, has no href for the browser to
 * show, and is invisible to anything that reads links.
 */
export function StartButton({ href, children }: { href: string; children: React.ReactNode }) {
  const host = useRef<HTMLAnchorElement | null>(null);

  const ripple = useCallback((event: React.PointerEvent<HTMLAnchorElement>) => {
    const node = host.current;
    if (!node) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const rect = node.getBoundingClientRect();
    const dot = document.createElement('span');
    dot.className = 'op-ripple';
    // Large enough to reach the far corner from wherever it was touched.
    const size = Math.max(rect.width, rect.height) * 2.2;
    dot.style.width = dot.style.height = `${size}px`;
    dot.style.left = `${event.clientX - rect.left - size / 2}px`;
    dot.style.top = `${event.clientY - rect.top - size / 2}px`;
    node.appendChild(dot);
    // Removed when the animation ends rather than on a matching timeout, so a
    // backgrounded tab (where animations are throttled) cannot leave the node
    // behind or cut the ripple short.
    dot.addEventListener('animationend', () => dot.remove(), { once: true });
  }, []);

  return (
    <LiquidButton asChild size="xxl" className="op-start">
      <Link ref={host} href={href} onPointerDown={ripple}>
        <span className="op-start-label">{children}</span>
        <Arrow />
      </Link>
    </LiquidButton>
  );
}
