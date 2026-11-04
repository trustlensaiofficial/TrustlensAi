import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Shell } from '@/components/ui/Shell';
import { Arrow } from '@/components/ui/icons';
import './opening.css';

export const metadata: Metadata = {
  title: 'TrustLens AI — Pause. Verify. Then act.',
};

/** The name, animated a word at a time once the mark has landed. */
const WORDS = ['TrustLens', 'AI'];

/* The timeline in one place: each value is when that step begins. */
const T = { mark: 0, word: 1150, tagline: 2050, start: 2500, skip: 2900 } as const;

/**
 * The opening.
 *
 * A server component: the whole sequence is CSS, so it starts on the first
 * painted frame rather than waiting for JavaScript, and there is nothing to
 * hydrate. Anyone who has been here before can skip straight past it.
 */
export default function Opening() {
  return (
    <Shell>
      <div className="op">
        <div className="op-mark">
          <span className="op-halo" aria-hidden="true" />
          <Image src="/logo-mark.png" alt="" width={564} height={472} priority sizes="128px" />
        </div>

        <h1 className="op-word">
          {WORDS.map((word, i) => (
            <span
              key={word}
              className={i === WORDS.length - 1 ? 'op-ai' : undefined}
              style={{ '--d': `${T.word + i * 170}ms` } as React.CSSProperties}
            >
              {word}
            </span>
          ))}
        </h1>

        <p className="op-tagline op-step" style={{ '--d': `${T.tagline}ms` } as React.CSSProperties}>
          Check whether a message, link or payment request deserves your trust — before you act on it.
        </p>

        <div className="op-step" style={{ '--d': `${T.start}ms` } as React.CSSProperties}>
          <span className="op-start">
            <Link href="/login?next=%2Fhome" className="btn btn-primary btn-lg">
              Start <Arrow />
            </Link>
          </span>
        </div>

        <p className="op-skip op-step" style={{ '--d': `${T.skip}ms` } as React.CSSProperties}>
          Already have an account? <Link href="/login?next=%2Fhome">Sign in</Link>
        </p>
      </div>
    </Shell>
  );
}
