'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * The living environment behind the opening.
 *
 * Built from compositor-only properties — transform and opacity, nothing that
 * triggers layout or paint — because this has to stay smooth on the ₹8,000
 * Android phone that most of the people this product is for actually use.
 * Every count below is a budget, not a preference: twenty-two particles, four
 * rings, three panels. Doubling any of them looks barely different and costs
 * frames where it matters.
 *
 * Everything is deterministic. A `Math.random()` field would render one way on
 * the server and another on the client and hydrate with a mismatch warning on
 * every single load.
 */

/**
 * The particle field, as literal values.
 *
 * This was generated from a sine hash at render time, and it caused a real
 * hydration mismatch: `Math.sin` is not required to be bit-identical between
 * Node and the browser's JS engine, so the server wrote `--depth: 0.24278767756186426`
 * and the client computed `...914021`. React tears the tree down and warns on
 * every load for a decorative dot.
 *
 * Literal values cannot drift. They were generated once by the formula and
 * rounded, which is also cheaper — twenty-two sine calls per render for a
 * field nobody will ever measure.
 *
 * left/top are percentages, size px, depth the parallax multiplier,
 * delay/duration seconds. Negative delays start each particle partway through
 * its loop so they do not all begin together.
 */
const PARTICLES = [
  { left: 18.29, top: 2.71, size: 2.44, depth: 0.21, delay: -1, duration: 29.6 },
  { left: 74.01, top: 7.39, size: 2.97, depth: 0.83, delay: -2.8, duration: 27.4 },
  { left: 56.44, top: 36.42, size: 2.54, depth: 0.54, delay: -2, duration: 16.5 },
  { left: 45.47, top: 33.52, size: 4.66, depth: 0.03, delay: -14.6, duration: 16.3 },
  { left: 27.24, top: 94.08, size: 3.66, depth: 0.11, delay: -3.6, duration: 27.5 },
  { left: 82.34, top: 53.79, size: 4.67, depth: 0.27, delay: -3.4, duration: 17.2 },
  { left: 75.28, top: 56.88, size: 3.91, depth: 0.97, delay: -12.2, duration: 19.6 },
  { left: 50.38, top: 56.65, size: 1.92, depth: 0.43, delay: -16.8, duration: 18 },
  { left: 52.34, top: 57.48, size: 4.46, depth: 0, delay: -12.1, duration: 25.4 },
  { left: 52.18, top: 56.83, size: 1.71, depth: 0.5, delay: -17.6, duration: 21.8 },
  { left: 1.99, top: 37.78, size: 2.5, depth: 0.58, delay: -15.7, duration: 26.3 },
  { left: 59.23, top: 91.6, size: 4.09, depth: 0.74, delay: -9.5, duration: 27.8 },
  { left: 61.11, top: 81.22, size: 3.71, depth: 0.63, delay: -16.6, duration: 25.8 },
  { left: 40.13, top: 19.75, size: 1.97, depth: 0.02, delay: -9.5, duration: 28.3 },
  { left: 84.91, top: 74.79, size: 1.72, depth: 0.42, delay: -5.8, duration: 22.9 },
  { left: 34.08, top: 66.55, size: 2.23, depth: 0.35, delay: -12.3, duration: 27.7 },
  { left: 42.24, top: 95.73, size: 3.22, depth: 0.24, delay: -9.7, duration: 20.5 },
  { left: 23.78, top: 45.59, size: 3.04, depth: 0.47, delay: -8.4, duration: 28.4 },
  { left: 98.73, top: 92.57, size: 2.06, depth: 0.33, delay: -0.7, duration: 25.5 },
  { left: 71, top: 50.11, size: 1.59, depth: 0.9, delay: -16.2, duration: 29.2 },
  { left: 86.56, top: 52.46, size: 1.98, depth: 0.82, delay: -16.9, duration: 24.2 },
  { left: 85.2, top: 49.78, size: 3.68, depth: 0.43, delay: -11.1, duration: 28.5 },
] as const;

const PANELS = [
  { className: 'op-panel-a', depth: 0.9 },
  { className: 'op-panel-b', depth: 0.55 },
  { className: 'op-panel-c', depth: 1.25 },
];

export function OpeningScene() {
  const root = useRef<HTMLDivElement | null>(null);

  /**
   * Parallax.
   *
   * Written straight to custom properties on the root node rather than through
   * React state: a pointer move is up to 120 events a second, and re-rendering
   * the tree on each one would be the single most expensive thing on the page.
   * The browser then moves the layers on the compositor without touching JS.
   */
  const apply = useCallback((nx: number, ny: number) => {
    const node = root.current;
    if (!node) return;
    node.style.setProperty('--px', nx.toFixed(4));
    node.style.setProperty('--py', ny.toFixed(4));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    // Someone who has asked for less motion gets a still scene, not a slower one.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (fine) {
      let frame = 0;
      const onMove = (event: PointerEvent) => {
        if (frame) return; // Coalesce to one update per frame.
        frame = requestAnimationFrame(() => {
          frame = 0;
          apply(event.clientX / window.innerWidth - 0.5, event.clientY / window.innerHeight - 0.5);
        });
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      return () => {
        window.removeEventListener('pointermove', onMove);
        if (frame) cancelAnimationFrame(frame);
      };
    }

    /*
     * On a phone the equivalent gesture is tilting the device. Permission is
     * never requested for it: iOS gates DeviceOrientation behind a user
     * gesture prompt, and interrupting a first-run animation with a permission
     * dialog to power a decorative parallax would be indefensible. Where the
     * event arrives without a prompt it is used; where it does not, the scene
     * is simply still.
     */
    let frame = 0;
    const onTilt = (event: DeviceOrientationEvent) => {
      if (frame || event.beta === null || event.gamma === null) return;
      const beta = event.beta;
      const gamma = event.gamma;
      frame = requestAnimationFrame(() => {
        frame = 0;
        // Clamped hard: a phone can report ±180, and anything past a gentle
        // wrist movement would fling the layers across the screen.
        apply(Math.max(-1, Math.min(1, gamma / 45)) * 0.5, Math.max(-1, Math.min(1, (beta - 45) / 45)) * 0.5);
      });
    };
    window.addEventListener('deviceorientation', onTilt, { passive: true });
    return () => {
      window.removeEventListener('deviceorientation', onTilt);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [apply]);

  return (
    <div ref={root} className="op-scene" aria-hidden="true">
      {/* Depth washes. Two large, soft lights that give the glass something
          to pick up — without them the panels read as grey rectangles. */}
      <div className="op-wash op-wash-cyan" />
      <div className="op-wash op-wash-violet" />

      {/* The horizon grid, in perspective. This is what makes the scene read
          as a space rather than a gradient. */}
      <div className="op-grid" />

      {/* Orbits. Concentric, tilted, each turning at its own rate so they
          never line up into a single moiré ring. */}
      <div className="op-orbits">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`op-orbit op-orbit-${i}`}>
            <i />
          </div>
        ))}
      </div>

      {/* Glass shards at different depths, caught in the light. */}
      {PANELS.map((p) => (
        <div key={p.className} className={`op-panel ${p.className}`} style={{ '--depth': p.depth } as React.CSSProperties} />
      ))}

      <div className="op-particles">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            style={
              {
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                '--depth': p.depth,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* A single beam, low opacity. More than one and the scene starts to
          look like a stock background rather than a product. */}
      <div className="op-beam" />
    </div>
  );
}
