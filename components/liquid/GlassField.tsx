/**
 * The living wallpaper.
 *
 * A field of liquid-glass cards drifting in 3D behind every page. Each one
 * sits at its own Z depth inside a shared perspective, so they pass each
 * other at different apparent speeds — that parallax is what reads as depth;
 * a single blurred gradient never does.
 *
 * Server component, pure CSS: no JS, nothing to hydrate, and it starts on
 * the first paint rather than after the bundle lands. The whole field is
 * `aria-hidden` and `pointer-events: none` — it is scenery, never content,
 * and it must never intercept a click meant for the page.
 *
 * The shapes are deliberately generic (a card, a pill, a ring). They suggest
 * the product's own surfaces without pretending to be real data, which would
 * be a lie on a page that has none.
 */

interface Shard {
  /** Percent from the left / top of the viewport. */
  x: number;
  y: number;
  /** Rendered size in px at depth 0. */
  size: number;
  /** Z depth: larger is nearer, so it drifts further and blurs less. */
  depth: number;
  /** Seconds for one full drift cycle. Primes avoid visible synchrony. */
  duration: number;
  delay: number;
  kind: 'card' | 'pill' | 'ring';
  tint: 'cyan' | 'violet' | 'blue';
}

/*
 * Hand-placed rather than random: a random field clumps, and a seeded
 * generator would still need tuning per breakpoint. These are spread so no
 * two near-depth shards overlap at any point in their cycles, and the
 * densest area sits away from where headings land.
 */
const SHARDS: Shard[] = [
  { x: 8,  y: 18, size: 150, depth: 90,  duration: 29, delay: 0,   kind: 'card', tint: 'cyan' },
  { x: 82, y: 12, size: 110, depth: 50,  duration: 37, delay: -6,  kind: 'pill', tint: 'violet' },
  { x: 68, y: 62, size: 180, depth: 120, duration: 31, delay: -14, kind: 'card', tint: 'blue' },
  { x: 16, y: 72, size: 96,  depth: 40,  duration: 43, delay: -3,  kind: 'ring', tint: 'cyan' },
  { x: 46, y: 30, size: 74,  depth: 20,  duration: 53, delay: -21, kind: 'pill', tint: 'blue' },
  { x: 90, y: 78, size: 130, depth: 70,  duration: 35, delay: -9,  kind: 'card', tint: 'violet' },
  { x: 32, y: 48, size: 62,  depth: 15,  duration: 47, delay: -17, kind: 'ring', tint: 'blue' },
  { x: 58, y: 88, size: 88,  depth: 35,  duration: 41, delay: -27, kind: 'pill', tint: 'cyan' },
];

export function GlassField() {
  return (
    <div className="gf" aria-hidden="true">
      {SHARDS.map((s, i) => (
        <span
          key={i}
          className={`gf-shard gf-${s.kind} gf-t-${s.tint}`}
          style={
            {
              '--x': `${s.x}%`,
              '--y': `${s.y}%`,
              '--size': `${s.size}px`,
              '--depth': `${s.depth}px`,
              '--dur': `${s.duration}s`,
              '--delay': `${s.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
