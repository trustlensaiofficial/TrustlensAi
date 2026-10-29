import Image from 'next/image';
import type { Metadata } from 'next';
import { FlowShell } from '@/components/liquid/FlowShell';
import { LiquidLink } from '@/components/liquid/LiquidButton';
import { ArrowIcon } from '@/components/icons';
import './opening.css';

export const metadata: Metadata = {
  title: 'TrustLens AI — verify before you act',
};

/** The name, animated a word at a time after the mark has landed. */
const WORDS = ['TrustLens', 'AI'];

/* The timeline, in one place. Each value is the moment that step begins. */
const T = {
  mark: 0,
  word: 1250,
  tagline: 2250,
  start: 2850,
} as const;

/**
 * The opening.
 *
 * A server component — the whole sequence is CSS, so there is nothing to
 * hydrate and the animation begins on the very first frame rather than after
 * the JavaScript arrives.
 */
export default function OpeningPage() {
  return (
    <FlowShell className="op" withHeader={false}>
      <div className="op-mark lq-step" style={{ '--d': `${T.mark}ms` } as React.CSSProperties}>
        <span className="op-halo" aria-hidden="true" />
        <Image
          src="/logo-mark.png"
          alt=""
          width={564}
          height={472}
          priority
          sizes="(max-width: 640px) 160px, 240px"
        />
      </div>

      <h1 className="op-word">
        {WORDS.map((word, index) => (
          <span
            key={word}
            className={index === WORDS.length - 1 ? 'lq-gradient-text' : undefined}
            style={{ '--d': `${T.word + index * 180}ms` } as React.CSSProperties}
          >
            {word}
          </span>
        ))}
      </h1>

      <p className="op-tagline lq-step" style={{ '--d': `${T.tagline}ms` } as React.CSSProperties}>
        Know whether a message, a link or a request deserves your trust.
      </p>

      <div className="op-actions lq-step" style={{ '--d': `${T.start}ms` } as React.CSSProperties}>
        <span className="op-start">
          <LiquidLink href="/login?next=%2Fstory" size="lg">
            Start
            <ArrowIcon />
          </LiquidLink>
        </span>
      </div>
    </FlowShell>
  );
}
