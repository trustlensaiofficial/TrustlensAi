'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  FILM_SCENES,
  LANG_LABEL,
  NARRATION_ORDER,
  scriptFor,
  type NarrationLang,
} from '@/lib/showcase/film';
import { isSupported, setMuted, speak, stop } from '@/lib/showcase/narration';
import { LiquidButton } from '@/components/liquid/LiquidButton';
import { ArrowIcon, CheckIcon, LensIcon } from '@/components/icons';

/** What the story is about, per language, shown on the chooser. */
const CHOOSER_BLURB: Record<NarrationLang, string> = {
  en: 'The story and every feature, narrated in English.',
  ta: 'கதையும் ஒவ்வொரு அம்சமும், தமிழில்.',
};

/**
 * The explainer, one scene at a time.
 *
 * Scenes advance when their narration finishes, with a duration-based
 * backstop so a muted or unavailable voice still moves the story along —
 * otherwise a browser with no speech engine would sit on scene one forever.
 * When the last scene ends the viewer goes straight to the features page,
 * which is what the brief asks for.
 */
export function StoryPlayer() {
  const router = useRouter();
  const [lang, setLang] = useState<NarrationLang | null>(null);
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
    if (lang === null) return;
    const current = FILM_SCENES[index];
    if (!current) return;

    let done = false;
    const finishOnce = () => {
      if (done) return;
      done = true;
      advance();
    };

    const text = scriptFor(current, lang);
    if (!silent && isSupported()) {
      speak(text, current.id, finishOnce);
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
  }, [lang, index, silent, advance]);

  /* Stop any speech if the viewer leaves mid-story. */
  useEffect(() => () => stop(), []);

  const choose = useCallback((picked: NarrationLang) => {
    setLang(picked);
    setIndex(0);
  }, []);

  const toggleSilent = useCallback(() => {
    setSilent((was) => {
      const next = !was;
      setMuted(next);
      if (next) stop();
      return next;
    });
  }, []);

  /* ----------------------------------------------------------- chooser -- */
  if (lang === null) {
    return (
      <div className="story-choose">
        <Image
          src="/logo-mark.png"
          alt=""
          width={141}
          height={118}
          className="story-choose-mark lq-step"
          style={{ '--d': '0ms' } as React.CSSProperties}
        />
        <h1 className="lq-h1 lq-step" style={{ '--d': '140ms' } as React.CSSProperties}>
          Choose your <span className="lq-gradient-text">language</span>
        </h1>
        <p className="lq-lede lq-step" style={{ '--d': '260ms' } as React.CSSProperties}>
          Next you will hear what TrustLens AI is, and then each of its features explained
          one at a time. Pick the language you would like it told in.
        </p>

        <div className="story-langs">
          {NARRATION_ORDER.map((code, i) => (
            <button
              key={code}
              type="button"
              className="lq-glass story-lang lq-step"
              style={{ '--d': `${380 + i * 110}ms` } as React.CSSProperties}
              onClick={() => choose(code)}
            >
              <span className="story-lang-name">{LANG_LABEL[code]}</span>
              <span className="story-lang-blurb">{CHOOSER_BLURB[code]}</span>
              <span className="story-lang-go" aria-hidden="true"><ArrowIcon /></span>
            </button>
          ))}
        </div>

        <button type="button" className="story-skip" onClick={goFeatures}>
          Skip the story, go to the features →
        </button>
      </div>
    );
  }

  /* ------------------------------------------------------------ player -- */
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
        {index + 1} of {FILM_SCENES.length} · {scene.label} · {LANG_LABEL[lang]}
      </p>

      {/* The key restarts the entrance animation on every scene change. */}
      <div className="story-scene" key={scene.id}>
        <span className="lq-eyebrow">
          <LensIcon />
          {scene.kicker}
        </span>
        <h1 className="lq-h1 story-title">{scene.title}</h1>
        <p className="story-caption">{scriptFor(scene, lang)}</p>
      </div>

      <div className="story-controls">
        <LiquidButton variant="ghost" size="sm" onClick={advance}>
          Next scene
          <ArrowIcon />
        </LiquidButton>
        <LiquidButton variant="ghost" size="sm" onClick={toggleSilent}>
          {silent ? 'Narration off' : 'Narration on'}
          {silent ? null : <CheckIcon />}
        </LiquidButton>
        <LiquidButton size="sm" onClick={goFeatures}>
          Go to features
          <ArrowIcon />
        </LiquidButton>
      </div>

      <p className="story-note">
        {isSupported() && !silent
          ? 'Narrated by your device’s voice. The caption above is the same script, word for word.'
          : 'Narration is off — the caption above carries the full script.'}
      </p>
    </div>
  );
}
