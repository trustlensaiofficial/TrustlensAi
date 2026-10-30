import {
  ChecklistIcon,
  ClockIcon,
  EvidenceIcon,
  GlobeIcon,
  HelpIcon,
  LensIcon,
  ScalesIcon,
  ShieldIcon,
} from '../icons';

/**
 * The living wallpaper.
 *
 * Liquid-glass cards drifting in 3D behind every page, each carrying one of
 * the product's own capabilities — an icon and its label. Blank cards read
 * as decoration; cards that name what the tool actually does reinforce the
 * pitch while the viewer reads the page in front of them.
 *
 * Each card sits at its own Z depth inside one shared perspective, so they
 * pass at different apparent speeds. That parallax is what reads as depth; a
 * single blurred gradient never does.
 *
 * Server component, pure CSS: no JS, nothing to hydrate, and it starts on
 * the first paint rather than after the bundle lands. The whole field is
 * `aria-hidden` and `pointer-events: none` — it is scenery, never content,
 * and must never intercept a click meant for the page.
 */

interface Card {
  label: string;
  icon: React.ReactNode;
  /** Percent from the left / top of the viewport. */
  x: number;
  y: number;
  /** Z depth: nearer cards drift further and sit larger. */
  depth: number;
  /** Seconds for one drift cycle. Spread apart to avoid visible synchrony. */
  duration: number;
  delay: number;
  tint: 'cyan' | 'violet' | 'blue';
}

/*
 * Hand-placed rather than random: a random field clumps, and the densest
 * area needs to sit away from where headings and the reading column land.
 */
const CARDS: Card[] = [
  { label: 'Evidence shown',   icon: <EvidenceIcon />,  x: 4,  y: 16, depth: 80,  duration: 29, delay: 0,   tint: 'cyan' },
  { label: 'Link inspected',   icon: <GlobeIcon />,     x: 79, y: 10, depth: 44,  duration: 37, delay: -6,  tint: 'violet' },
  { label: 'Next safe step',   icon: <ChecklistIcon />, x: 71, y: 63, depth: 104, duration: 31, delay: -14, tint: 'blue' },
  { label: 'What is unknown',  icon: <HelpIcon />,      x: 9,  y: 70, depth: 36,  duration: 43, delay: -3,  tint: 'cyan' },
  { label: 'Rule matched',     icon: <ScalesIcon />,    x: 40, y: 26, depth: 18,  duration: 53, delay: -21, tint: 'blue' },
  { label: 'Report kept',      icon: <ClockIcon />,     x: 86, y: 80, depth: 64,  duration: 35, delay: -9,  tint: 'violet' },
  { label: 'Claim checked',    icon: <LensIcon />,      x: 27, y: 50, depth: 14,  duration: 47, delay: -17, tint: 'blue' },
  { label: 'Verified safely',  icon: <ShieldIcon />,    x: 55, y: 88, depth: 30,  duration: 41, delay: -27, tint: 'cyan' },
];

export function GlassField() {
  return (
    <div className="gf" aria-hidden="true">
      {CARDS.map((c) => (
        <span
          key={c.label}
          className={`gf-card gf-t-${c.tint}`}
          style={
            {
              '--x': `${c.x}%`,
              '--y': `${c.y}%`,
              '--depth': `${c.depth}px`,
              '--dur': `${c.duration}s`,
              '--delay': `${c.delay}s`,
            } as React.CSSProperties
          }
        >
          <span className="gf-icon">{c.icon}</span>
          <span className="gf-label">{c.label}</span>
        </span>
      ))}
    </div>
  );
}
