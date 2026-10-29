'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExplainerFilm } from '@/components/showcase/ExplainerFilm';
import { FeatureTour } from '@/components/showcase/FeatureTour';
import { IntroScene } from '@/components/showcase/IntroScene';
import { LensDock, type DockAction } from '@/components/showcase/LensDock';
import { stop as stopVoice } from '@/lib/showcase/narration';
import './showcase.css';

type Phase = 'intro' | 'film' | 'tour';

/**
 * The showcase experience: cinematic reveal, explainer film, guided tour.
 *
 * One phase machine rather than three routes, so transitions are instant and
 * the narration can be stopped reliably on every exit path. The product
 * itself is untouched — this sits alongside /analyze, and every panel in the
 * tour embeds the real shipping components.
 */
export default function ShowcasePage() {
  const [phase, setPhase] = useState<Phase>('intro');
  const router = useRouter();

  const toFilm = useCallback(() => { stopVoice(); setPhase('film'); window.scrollTo({ top: 0 }); }, []);
  const toTour = useCallback(() => { stopVoice(); setPhase('tour'); window.scrollTo({ top: 0 }); }, []);
  const toIntro = useCallback(() => { stopVoice(); setPhase('intro'); window.scrollTo({ top: 0 }); }, []);

  const dockActions: DockAction[] = (() => {
    const common: DockAction[] = [
      { id: 'workspace', label: 'Open the real workspace', icon: 'new', href: '/analyze' },
      { id: 'history', label: 'View history', icon: 'history', href: '/history' },
    ];
    if (phase === 'intro') {
      return [
        { id: 'enter', label: 'Enter the experience', icon: 'lens', onSelect: toFilm },
        { id: 'features', label: 'Skip to the feature tour', icon: 'checklist', onSelect: toTour },
        ...common,
      ];
    }
    if (phase === 'film') {
      return [
        { id: 'features', label: 'Skip to the feature tour', icon: 'checklist', onSelect: toTour },
        { id: 'intro', label: 'Back to the intro', icon: 'shield', onSelect: toIntro },
        ...common,
      ];
    }
    return [
      { id: 'replay', label: 'Replay the film', icon: 'lens', onSelect: toFilm },
      { id: 'intro', label: 'Back to the intro', icon: 'shield', onSelect: toIntro },
      ...common,
      { id: 'help', label: 'About this prototype', icon: 'help', onSelect: () => router.push('/') },
    ];
  })();

  return (
    <div className="sc">
      <div className="sc-layer">
        {phase === 'intro' && <IntroScene onEnter={toFilm} onSkip={toTour} />}
        {phase === 'film' && <ExplainerFilm onFinish={toTour} onSkip={toTour} />}
        {phase === 'tour' && <FeatureTour onRestart={toTour} onHome={toIntro} />}
      </div>
      <LensDock actions={dockActions} />
    </div>
  );
}
