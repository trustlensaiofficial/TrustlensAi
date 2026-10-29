'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FILM_SCENES } from '@/lib/showcase/film';
import { isSupported, setMuted, speak, stop } from '@/lib/showcase/narration';
import { LiquidButton } from '@/components/liquid/LiquidButton';
import { SlideVisual } from '@/components/liquid/SlideVisual';
import { ArrowIcon, LensIcon } from '@/components/icons';

/**
 * The explainer, one cinematic slide at a time.
 *
 * Narrated in English only. An earlier build offered a Tamil pass, but the
 * script was romanised Tamil and every available speech engine read it as
 * mangled English — so it is gone rather than shipped broken. There is no
 * language step in front of the story either: picking one was a gate before
 * the thing the viewer actually came for.
 *
 * Scenes advance when the narration finishes, with a duration backstop so a
 * muted or unavailable voice still moves the story along. When the last
 * scene ends the viewer goes straight to the features page.
 */
export function StoryPlayer() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [silent, setSilent] = useState(false);

  // Guards the one-way exit: narration ending and a click can race.
  const finishedRef = useRef(false);

  const scene = FILM_SCENES[index];
  const isLast = index === FILM_SCENES.length - 1;

  const goFeatures = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    stop();
    router.push('/features');
  }, [router]);

  const advance = useCallback(() => {
    if (isLast) {
      goFeatures();
      return;
    }
    setIndex((prev) => prev + 1);
  }, [isLast, goFeatures]);

  /* Speak the current scene, and keep a backstop timer running. */
  useEffect(() => {
    const current = FILM_SCENES[index];
    if (!current) return;

    let done = false;
    const finishOnce = () => {
      if (done) return;
      done = true;
      advance();
    };

    if (!silent && isSupported()) {
      speak(current.en, current.id, finishOnce);
    }
    // Runs whether or not speech started: if the engine is missing, muted or
    // silently fails, this is what keeps the story moving.
    const backstop = window.setTimeout(
      finishOnce,
      silent || !isSupported() ? current.durationMs : current.durationMs + 6000,
    );

    return () => {
      done = true;
      window.clearTimeout(backstop);
      stop();
    };
  }, [index, silent, advance]);

  /* Stop any speech if the viewer leaves mid-story. */
  useEffect(() => () => stop(), []);

  const toggleSilent = useCallback(() => {
    setSilent((was) => {
      const next = !was;
      setMuted(next);
      if (next) stop();
      return next;
    });
  }, []);

  if (!scene) return null;

  return (
    <div className="story-play">
      <div className="story-rail" aria-hidden="true">
        {FILM_SCENES.map((s, i) => (
          <span
            key={s.id}
            className={`story-tick${i < index ? ' done' : ''}${i === index ? ' now' : ''}`}
          />
        ))}
      </div>

      <p className="story-count">
        {index + 1} of {FILM_SCENES.length} · {scene.label}
      </p>

      {/* The key restarts the slide and caption animation on every scene. */}
      <div className="story-scene" key={scene.id}>
        <SlideVisual id={scene.id} />

        <div className="story-text">
          <span className="lq-eyebrow">
            <LensIcon />
            {scene.kicker}
          </span>
          <h1 className="lq-h1 story-title">{scene.title}</h1>
          <p className="story-caption">{scene.en}</p>
        </div>
      </div>

      <div className="story-controls">
        <LiquidButton variant="ghost" size="sm" onClick={advance}>
          {isLast ? 'Finish' : 'Next'}
          <ArrowIcon />
        </LiquidButton>
        <LiquidButton variant="ghost" size="sm" onClick={toggleSilent}>
          {silent ? 'Narration off' : 'Narration on'}
        </LiquidButton>
        <LiquidButton size="sm" onClick={goFeatures}>
          Skip to features
          <ArrowIcon />
        </LiquidButton>
      </div>
    </div>
  );
}
