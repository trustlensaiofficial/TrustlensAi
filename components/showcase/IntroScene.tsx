'use client';

import { BrandMark } from '../BrandMark';
import { ArrowIcon } from '../icons';

/**
 * ---------------------------------------------------------------------------
 * OFFICIAL LOGO SWAP POINT
 *
 * Set this to a path under /public (e.g. '/logo-official.png') once the real
 * asset is on disk, and the intro will render that file instead of the drawn
 * mark — preserving its own aspect ratio via `height: auto`.
 *
 * It is null today because the supplied logo could not be located on this
 * machine: Downloads, Desktop, Documents, Pictures and the project tree were
 * searched, and the hackathon PDF was unpacked (its embedded images are the
 * Dexathon event logo, the Sathyabama crest and a background texture — not
 * the product logo). The drawn mark below is a reproduction, not the original.
 * ---------------------------------------------------------------------------
 */
const OFFICIAL_LOGO_SRC: string | null = null;

export function IntroScene({ onEnter, onSkip }: { onEnter: () => void; onSkip: () => void }) {
  return (
    <section className="sc-intro" aria-labelledby="sc-intro-title">
      <div className="sc-skip">
        <button type="button" className="sc-btn sc-btn-ghost sc-btn-sm" onClick={onSkip}>
          Skip intro
        </button>
      </div>

      <div className="sc-intro-inner">
        <p className="sc-eyebrow">
          <i /> Trust intelligence
        </p>

        <h1 id="sc-intro-title" className="sc-wordmark">
          TrustLens <span className="sc-ai">AI</span>
        </h1>

        <div className="sc-lockup">
          <div className="sc-lockup-ring">
            {OFFICIAL_LOGO_SRC ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={OFFICIAL_LOGO_SRC}
                alt="TrustLens AI"
                style={{ width: '72%', height: 'auto', display: 'block' }}
              />
            ) : (
              <BrandMark size={92} idSuffix="intro" />
            )}
          </div>
        </div>

        <p className="sc-tagline">
          See the signal. Understand the evidence. Know your next move.
        </p>

        <div className="sc-intro-cta">
          <button type="button" className="sc-btn sc-btn-primary sc-btn-lg" onClick={onEnter}>
            Enter the experience
            <ArrowIcon />
          </button>
        </div>

        <p className="sc-intro-note">
          A guided prototype walkthrough · about three minutes
        </p>
      </div>
    </section>
  );
}
