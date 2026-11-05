import { LogoMark } from './LogoMark';
import { cn } from '@/lib/utils';

/**
 * The name, set as live text.
 *
 * The supplied logo file had the wordmark baked in as white pixels, which is
 * why the brand disappeared on the light theme. Setting it as text fixes that
 * for free — it inherits the theme's foreground, stays sharp at every zoom,
 * is selectable and searchable, and is read correctly by a screen reader
 * instead of needing alt text that duplicates it.
 *
 * "AI" carries the brand gradient. `background-clip: text` degrades to the
 * accent colour where it is unsupported, so the name is never invisible.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('tl-wordmark', className)}>
      TrustLens<span className="tl-wordmark-ai">AI</span>
    </span>
  );
}

export interface LogoProps {
  /** Mark size in px; the wordmark scales with it. */
  size?: number;
  /** Hide the name and show the mark alone — for tight chrome. */
  markOnly?: boolean;
  className?: string;
}

/** The lockup: mark and name, locked to a consistent optical relationship. */
export function Logo({ size = 34, markOnly = false, className }: LogoProps) {
  return (
    <span className={cn('tl-logo', className)} style={{ '--logo-size': `${size}px` } as React.CSSProperties}>
      <LogoMark size={size} title={markOnly ? 'TrustLens AI' : null} />
      {markOnly ? null : <Wordmark />}
    </span>
  );
}
