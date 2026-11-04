import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Shell } from '@/components/ui/Shell';
import { Arrow } from '@/components/ui/icons';
import './opening.css';

export const metadata: Metadata = {
  title: 'TrustLens AI — Pause. Verify. Then act.',
};

const WORDS = ['TrustLens', 'AI'];
const T = { word: 1150, tagline: 2050, start: 2500, skip: 2900 } as const;

export default function Opening() {
  return (
    <Shell>
      <main className="op" aria-labelledby="op-title">
        <div className="op-scene" aria-hidden="true">
          <div className="op-scene-grid" />
          <div className="op-orb op-orb-one" />
          <div className="op-orb op-orb-two" />
          <div className="op-orbit op-orbit-one"><i /></div>
          <div className="op-orbit op-orbit-two"><i /></div>
          <div className="op-star op-star-one" />
          <div className="op-star op-star-two" />
          <div className="op-star op-star-three" />
          <div className="op-star op-star-four" />
        </div>

        <div className="op-content">
          <div className="op-mark">
            <span className="op-halo" aria-hidden="true" />
            <span className="op-mark-glint" aria-hidden="true" />
            <Image src="/logo-official.png" alt="TrustLens AI" width={512} height={512} priority sizes="(max-width: 600px) 112px, 144px" />
          </div>

          <h1 className="op-word" id="op-title">
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
            A clearer way to pause, verify and protect what matters.
          </p>

          <div className="op-step" style={{ '--d': `${T.start}ms` } as React.CSSProperties}>
            <span className="op-start">
              <Link href="/login?next=%2Fhome" className="op-start-link">
                <span>Start</span><Arrow />
              </Link>
            </span>
          </div>

          <p className="op-skip op-step" style={{ '--d': `${T.skip}ms` } as React.CSSProperties}>
            Already have an account? <Link href="/login?next=%2Fhome">Sign in</Link>
          </p>
        </div>
      </main>
    </Shell>
  );
}
