'use client';

import { useId } from 'react';
import mark from '@/lib/brand/mark.json';

/**
 * The TrustLens AI brandmark, as vector.
 *
 * This replaces the raster logo, and the reason is specific: `logo-official.png`
 * carries a white wordmark, so on the light theme the name was invisible, and
 * both PNGs have a marching-ants selection outline baked into their edges from
 * whatever exported them. Neither is fixable by scaling a bitmap. Drawn, the
 * mark is crisp at every size, has no halo on either ground, and costs no
 * second request on first paint.
 *
 * The geometry lives in `lib/brand/mark.json` because `scripts/build-brand.mjs`
 * generates the install icons from the same numbers. A hand-kept duplicate had
 * already drifted once; now the home-screen icon cannot stop matching the logo
 * on screen.
 *
 * Gradient ids are per instance. Two marks on one page sharing a literal id
 * would both resolve to whichever `<defs>` the document parsed first, and one
 * would silently lose its gradient.
 */

type Stop = [number, string, number];
interface LinearGradient { type: 'linear'; x1: number; y1: number; x2: number; y2: number; stops: Stop[] }
interface RadialGradient { type: 'radial'; cx: number; cy: number; r: number; stops: Stop[] }
type Gradient = LinearGradient | RadialGradient;

const G = mark.gradients as unknown as Record<string, Gradient>;

export interface LogoMarkProps {
  /** Rendered edge length in px. The artwork is square. */
  size?: number;
  className?: string;
  /**
   * Draws the dark rounded plate behind the mark — the install-icon
   * treatment. A home-screen icon sits on the user's own wallpaper, so it
   * has to carry its own ground rather than inherit one.
   */
  plate?: boolean;
  /** Pass null when an adjacent element already names the brand. */
  title?: string | null;
}

function Stops({ stops }: { stops: Stop[] }) {
  return (
    <>
      {stops.map(([offset, color, alpha]) => (
        <stop key={`${offset}-${color}`} offset={offset} stopColor={color} stopOpacity={alpha} />
      ))}
    </>
  );
}

export function LogoMark({ size = 40, className, plate = false, title = 'TrustLens AI' }: LogoMarkProps) {
  const uid = useId().replace(/:/g, '');
  const id = (name: string) => `tl-${name}-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={mark.viewBox}
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <defs>
        {Object.entries(G).map(([name, g]) =>
          g.type === 'linear' ? (
            <linearGradient key={name} id={id(name)} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} gradientUnits="userSpaceOnUse">
              <Stops stops={g.stops} />
            </linearGradient>
          ) : (
            <radialGradient key={name} id={id(name)} cx={g.cx} cy={g.cy} r={g.r}>
              <Stops stops={g.stops} />
            </radialGradient>
          ),
        )}
        <clipPath id={id('globeClip')}>
          <circle cx={mark.globe.cx} cy={mark.globe.cy} r={mark.globe.r} />
        </clipPath>
      </defs>

      {plate ? <rect width="64" height="64" rx={mark.plate.radius} fill={mark.plate.fill} /> : null}

      {/* Shield. Stroked rather than filled — that is what gives the mark its
          open, instrument-like feel rather than a badge's solidity. */}
      <path
        d={mark.shield.d}
        fill="none"
        stroke={`url(#${id('sweep')})`}
        strokeWidth={mark.shield.width}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Eye. The dark sclera stays dark in both themes: it is the part of the
          mark people recognise, and inverting it per theme would read as two
          different logos. */}
      <path
        d={mark.eye.d}
        fill={mark.eye.fill}
        stroke={`url(#${id('rim')})`}
        strokeWidth={mark.eye.width}
        strokeLinejoin="round"
      />

      <circle cx={mark.globe.cx} cy={mark.globe.cy} r={mark.globe.r} fill={`url(#${id('globe')})`} />
      <g clipPath={`url(#${id('globeClip')})`}>
        {mark.land.map((l) => (
          <path key={l.d.slice(0, 12)} d={l.d} fill={`url(#${id('land')})`} opacity={l.opacity} />
        ))}
      </g>
      {/* One light source, upper left, consistent with every other surface. */}
      <circle cx={mark.specular.cx} cy={mark.specular.cy} r={mark.specular.r} fill="#FFFFFF" opacity={mark.specular.opacity} />
      <circle cx={mark.globe.cx} cy={mark.globe.cy} r={mark.globe.r} fill={`url(#${id('gloss')})`} />
      <circle
        cx={mark.globe.cx}
        cy={mark.globe.cy}
        r={mark.globe.r}
        fill="none"
        stroke={mark.globeEdge.stroke}
        strokeWidth={mark.globeEdge.width}
        opacity={mark.globeEdge.opacity}
      />

      {/* The handle stops inside the shield on purpose. Run past the edge and
          the two diagonals read as an X instead of as a lens with a handle. */}
      <path d={mark.handle.d} stroke={`url(#${id('sweep')})`} strokeWidth={mark.handle.width} strokeLinecap="round" />

      <g fill={`url(#${id('sweep')})`}>
        {mark.motes.map((d) => (
          <rect key={`${d.x}-${d.y}`} x={d.x} y={d.y} width={d.size} height={d.size} rx={d.radius} opacity={d.opacity} />
        ))}
      </g>
    </svg>
  );
}
