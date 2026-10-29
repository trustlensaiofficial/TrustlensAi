'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';

const reduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Pointer-driven 3D tilt with a specular sheen that tracks the cursor.
 *
 * All values are written as CSS custom properties on the element, so the
 * animation stays on the compositor and this component never re-renders.
 * Rotation is capped deliberately low — past about 8 degrees a card stops
 * reading as a surface and starts reading as a gimmick.
 */
export function Tilt({
  children,
  max = 6,
  className = '',
}: {
  children: ReactNode;
  max?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el || reduced()) return;
      const b = el.getBoundingClientRect();
      const px = (e.clientX - b.left) / b.width;
      const py = (e.clientY - b.top) / b.height;
      el.style.setProperty('--ry', `${(px - 0.5) * max * 2}deg`);
      el.style.setProperty('--rx', `${(0.5 - py) * max * 2}deg`);
      el.style.setProperty('--ty', '-4px');
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
      el.dataset.active = 'true';
    },
    [max],
  );

  const reset = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.dataset.active = 'false';
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--ty', '0px');
  }, []);

  return (
    <div
      ref={ref}
      className={`tilt ${className}`}
      onPointerMove={onMove}
      onPointerLeave={reset}
      // Touch devices get no tilt: there is no hover, and a tilt that only
      // fires mid-tap feels like a bug rather than a flourish.
      onPointerDown={(e) => { if (e.pointerType !== 'mouse') reset(); }}
    >
      <div className="tilt-inner">
        {children}
        <span className="tilt-sheen" aria-hidden="true" />
      </div>
    </div>
  );
}

/**
 * Reveals children once they scroll into view.
 *
 * Uses IntersectionObserver and toggles a data attribute — no state, so a
 * long page with many reveals costs no renders. Elements are shown
 * immediately if the browser lacks the observer, so content can never be
 * trapped invisible.
 */
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced() || typeof IntersectionObserver === 'undefined') {
      el.dataset.shown = 'true';
      return;
    }
    const show = () => { el.dataset.shown = 'true'; };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show();
            io.unobserve(el);
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );
    io.observe(el);

    /**
     * Backstop. A reveal that never fires leaves real content stuck at
     * opacity 0, which is far worse than losing an animation — and there are
     * several ways for the observer to stay quiet: a zero-size or hidden
     * container, a print or screenshot context, or a browser that throttles
     * callbacks in a background tab. After a short grace period the content
     * is shown regardless.
     */
    const backstop = setTimeout(show, 1200);

    return () => {
      clearTimeout(backstop);
      io.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/**
 * Makes a control lean a few pixels toward the cursor.
 *
 * Capped at 6px: enough that the button feels alive, never enough that it
 * moves out from under the pointer — a "magnetic" button you have to chase
 * is a worse button.
 */
export function Magnetic({
  children,
  strength = 6,
  className = '',
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLSpanElement>) => {
      const el = ref.current;
      if (!el || reduced() || e.pointerType !== 'mouse') return;
      const b = el.getBoundingClientRect();
      const dx = (e.clientX - (b.left + b.width / 2)) / (b.width / 2);
      const dy = (e.clientY - (b.top + b.height / 2)) / (b.height / 2);
      el.style.setProperty('--pull-x', `${Math.max(-1, Math.min(1, dx)) * strength}px`);
      el.style.setProperty('--pull-y', `${Math.max(-1, Math.min(1, dy)) * strength}px`);
      el.dataset.pull = 'true';
    },
    [strength],
  );

  const reset = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.dataset.pull = 'false';
    el.style.setProperty('--pull-x', '0px');
    el.style.setProperty('--pull-y', '0px');
  }, []);

  return (
    <span
      ref={ref}
      className={`magnetic ${className}`}
      style={{ display: 'inline-flex' }}
      onPointerMove={onMove}
      onPointerLeave={reset}
      onPointerUp={reset}
    >
      {children}
    </span>
  );
}
