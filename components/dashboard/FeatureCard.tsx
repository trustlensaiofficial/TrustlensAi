'use client';

import Link from 'next/link';
import GlassCard from '@/components/ui/glass-card';
import { Arrow } from '@/components/ui/icons';
import { useFinePointer } from '@/lib/hooks/use-capability';
import type { Feature } from '@/lib/features';
import { useT } from '@/components/i18n/LocaleProvider';
import type { DictKey } from '@/lib/i18n';

/**
 * One feature, as a floating pane of glass.
 *
 * The refractive rim is the expensive part — a masked `backdrop-filter` plus,
 * on Chromium, an SVG displacement — and this grid has ten of them. So the
 * cost is spent where it is visible and withheld where it is not:
 *
 *   Fine pointer:  full refraction, the pointer-tracked specular sweep, lift.
 *   Touch:         a thinner rim and no displacement. There is no pointer to
 *                  track, so the sweep would never move, and ten displacement
 *                  filters on a mid-range Android buys nothing and costs
 *                  frames on the screen people actually use.
 *
 * `GlassCard` already declines to track a pointer that does not exist; this
 * goes further and declines to build the filter at all.
 */
export function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const fine = useFinePointer();
  const t = useT();
  // The id is the translation namespace, so a card added to lib/features.tsx
  // with no dictionary entry fails to compile rather than rendering a key.
  const key = (part: 'title' | 'blurb' | 'action') => `feature.${feature.id}.${part}` as DictKey;

  return (
    <li className="feat" style={{ '--hue': feature.hue, '--i': index } as React.CSSProperties}>
      <GlassCard
        className="feat-glass"
        radius={22}
        rimWidth={fine ? 9 : 6}
        blur={fine ? 14 : 10}
        refraction={fine ? 20 : 0}
        specular={fine}
        tint="var(--glass-tint)"
        interactive={fine}
      >
        {/*
          The whole card is the link, stretched over the pane with ::after.
          Wrapping GlassCard in an <a> instead would put a motion.div's
          transform inside a link and break the hit area on a hover lift.
        */}
        <Link href={feature.href} className="feat-link">
          <span className="feat-top">
            <span className="feat-icon" aria-hidden="true">{feature.icon}</span>
            <span className="feat-no" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          </span>
          <span className="feat-title">{t(key('title'))}</span>
          <span className="feat-blurb">{t(key('blurb'))}</span>
          <span className="feat-action">
            {t(key('action'))}
            <Arrow />
          </span>
        </Link>
      </GlassCard>
    </li>
  );
}
