import Link from 'next/link';
import type { Metadata } from 'next';
import { LogoMark } from '@/components/brand/LogoMark';
import { OpeningScene } from '@/components/opening/OpeningScene';
import { StartButton } from '@/components/opening/StartButton';
import { Shield } from '@/components/ui/icons';
import { getTranslations } from '@/lib/i18n/server';
import './opening.css';

export const metadata: Metadata = {
  title: 'TrustLens AI — Pause. Verify. Then act.',
};

/** The name, revealed a word at a time once the mark has landed. */
const WORDS = ['TrustLens', 'AI'];

/*
 * The timeline, in one place.
 *
 * The whole sequence finishes at 1.74s. That number is a deliberate ceiling:
 * this screen stands between someone and the thing they came to do, and an
 * opening that outstays its welcome is one people learn to skip. Long enough
 * to feel considered, short enough that nobody reaches for the back button.
 */
const T = { word: 620, line: 1040, cta: 1280, alt: 1500, note: 1740 } as const;

/**
 * The opening.
 *
 * Deliberately a server component. The sequence is CSS, so it begins on the
 * first painted frame instead of waiting for a bundle to download, parse and
 * hydrate — on a mid-range Android that is the difference between a cinematic
 * entrance and a blank screen followed by a jump. Only the two pieces that
 * genuinely need the client (the parallax scene, the ripple on Start) are
 * client components.
 */
export default async function Opening() {
  const { t } = await getTranslations();

  return (
    <div className="op">
      <OpeningScene />

      <div className="op-stage">
        <div className="op-mark">
          <span className="op-halo" aria-hidden="true" />
          <LogoMark size={116} title={null} />
          <span className="op-glint" aria-hidden="true" />
        </div>

        <h1 className="op-word">
          {WORDS.map((word, i) => (
            <span
              key={word}
              className={i === WORDS.length - 1 ? 'op-ai' : undefined}
              style={{ '--d': `${T.word + i * 150}ms` } as React.CSSProperties}
            >
              {word}
            </span>
          ))}
        </h1>

        <p className="op-line op-step" style={{ '--d': `${T.line}ms` } as React.CSSProperties}>
          {t('open.line')}
        </p>

        <div className="op-cta op-step" style={{ '--d': `${T.cta}ms` } as React.CSSProperties}>
          <StartButton href="/login?next=%2Fhome">{t('open.start')}</StartButton>
        </div>

        <p className="op-alt op-step" style={{ '--d': `${T.alt}ms` } as React.CSSProperties}>
          {t('open.haveAccount')} <Link href="/login?next=%2Fhome">{t('open.signIn')}</Link>
        </p>
      </div>

      {/*
        On the first screen, not buried in settings. The single claim this
        product must never make by implication is that it reads your messages
        on its own — and an opening that shows a shield and says nothing is
        exactly how that impression forms.
      */}
      <p className="op-note op-step" style={{ '--d': `${T.note}ms` } as React.CSSProperties}>
        <Shield />
        <span>{t('open.promise')}</span>
      </p>
    </div>
  );
}
