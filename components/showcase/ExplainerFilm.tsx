'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { FILM_SCENES, FILM_TOTAL_MS, FILM_TRANSCRIPT, sceneStartMs } from '@/lib/showcase/film';
import {
  RECORDED_NARRATION,
  getChosenVoiceName,
  getNarrationState,
  getServerNarrationState,
  isMuted,
  listVoices,
  pause as pauseVoice,
  resume as resumeVoice,
  setChosenVoiceName,
  setMuted,
  speak,
  stop as stopVoice,
  subscribeNarration,
} from '@/lib/showcase/narration';
import { AlertIcon, ArrowIcon, InfoIcon, LensIcon } from '../icons';
import { SceneVisual } from './FilmScenes';

const TICK_MS = 100;

export function ExplainerFilm({ onFinish, onSkip }: { onFinish: () => void; onSkip: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const spokenFor = useRef(-1);
  /**
   * Wall-clock anchors. Counting ticks drifts badly whenever the browser
   * throttles timers — a backgrounded or hidden tab drops setInterval to
   * roughly once a second, which would desynchronise the captions from the
   * narration. Reading performance.now() instead means throttling only costs
   * us update frequency, never accuracy.
   */
  const anchorRef = useRef<{ at: number; base: number } | null>(null);

  const voiceState = useSyncExternalStore(subscribeNarration, getNarrationState, getServerNarrationState);
  const muted = useSyncExternalStore(subscribeNarration, isMuted, () => false);
  const chosenVoice = useSyncExternalStore(subscribeNarration, getChosenVoiceName, () => null);
  const supported = voiceState !== 'unsupported';

  // Voices arrive asynchronously; read them through the same store so the
  // picker fills in as soon as the platform publishes them.
  const voices = useSyncExternalStore(
    subscribeNarration,
    () => listVoices().map((v) => `${v.name}|${v.lang}`).join(','),
    () => '',
  );
  const voiceOptions = voices ? voices.split(',').map((s) => {
    const [name, lang] = s.split('|');
    return { name: name ?? '', lang: lang ?? '' };
  }) : [];

  // Derived, not stored: the film is over exactly when the clock says so.
  const ended = elapsed >= FILM_TOTAL_MS;

  let sceneIndex = 0;
  let acc = 0;
  for (let i = 0; i < FILM_SCENES.length; i += 1) {
    const d = FILM_SCENES[i]?.durationMs ?? 0;
    if (elapsed < acc + d) { sceneIndex = i; break; }
    acc += d;
    sceneIndex = i;
  }
  const scene = FILM_SCENES[sceneIndex]!;
  const tInScene = elapsed - sceneStartMs(sceneIndex);

  useEffect(() => {
    if (!playing || ended) return;
    anchorRef.current = { at: performance.now(), base: elapsed };
    const t = setInterval(() => {
      const a = anchorRef.current;
      if (!a) return;
      setElapsed(Math.min(a.base + (performance.now() - a.at), FILM_TOTAL_MS));
    }, TICK_MS);
    return () => {
      clearInterval(t);
      anchorRef.current = null;
    };
    // `elapsed` is intentionally omitted: it is re-anchored on each
    // play/pause/seek, and including it would restart the interval every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, ended]);

  // One narration line per scene. speak() cancels anything in flight.
  useEffect(() => {
    if (!playing || ended || muted) return;
    if (spokenFor.current === sceneIndex) return;
    spokenFor.current = sceneIndex;
    speak(scene.line, scene.id);
  }, [sceneIndex, playing, ended, muted, scene.line, scene.id]);

  useEffect(() => () => stopVoice(), []);

  const replay = useCallback(() => {
    stopVoice();
    spokenFor.current = -1;
    anchorRef.current = { at: performance.now(), base: 0 };
    setElapsed(0);
    setPlaying(true);
  }, []);

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      const next = !p;
      if (next) resumeVoice(); else pauseVoice();
      return next;
    });
  }, []);

  const jumpTo = useCallback((i: number) => {
    stopVoice();
    spokenFor.current = -1;
    const base = sceneStartMs(i);
    anchorRef.current = { at: performance.now(), base };
    setElapsed(base);
    setPlaying(true);
  }, []);

  const skip = useCallback(() => { stopVoice(); onSkip(); }, [onSkip]);
  const finish = useCallback(() => { stopVoice(); onFinish(); }, [onFinish]);

  const pct = Math.min(100, Math.round((elapsed / FILM_TOTAL_MS) * 100));

  return (
    <section className="sc-film sc-shell" aria-labelledby="sc-film-title">
      <div className="sc-film-head">
        <div>
          <p className="sc-eyebrow"><i /> Scripted presentation</p>
          <h2 id="sc-film-title" style={{ fontSize: 'clamp(18px, 2.3vw, 24px)', marginTop: 8 }}>
            TrustLens AI, feature by feature
          </h2>
        </div>
        <button type="button" className="sc-btn sc-btn-ghost sc-btn-sm" onClick={skip}>
          Skip to the prototype
        </button>
      </div>

      {/* progress rail — each segment is also a jump target */}
      <div>
        <div className="sc-rail">
          {FILM_SCENES.map((s, i) => {
            const start = sceneStartMs(i);
            const local = Math.min(Math.max(elapsed - start, 0), s.durationMs);
            return (
              <button
                type="button"
                className="sc-rail-seg"
                key={s.id}
                onClick={() => jumpTo(i)}
                aria-label={`Jump to scene ${i + 1}: ${s.label}`}
                style={{ border: 0, padding: 0, cursor: 'pointer' }}
              >
                <span className="sc-rail-fill" style={{ width: `${(local / s.durationMs) * 100}%`, display: 'block' }} />
              </button>
            );
          })}
        </div>
        <div className="sc-rail-labels" aria-hidden="true">
          {FILM_SCENES.map((s, i) => (
            <span className="sc-rail-label" key={s.id} data-on={i === sceneIndex}>{s.label}</span>
          ))}
        </div>
        {/* Narrow screens get the current scene name instead of all eleven. */}
        <span className="sc-rail-current" aria-hidden="true">
          {sceneIndex + 1} / {FILM_SCENES.length} · {scene.label}
        </span>
      </div>

      <div className="sc-stage">
        <div style={{ width: '100%' }} key={scene.id}>
          <div className="sc-scene-head">
            <span className="sc-scene-kicker"><i /> {scene.kicker}</span>
            <h3 className="sc-scene-title">{scene.title}</h3>
          </div>
          <SceneVisual id={scene.id} t={tInScene} />
        </div>
      </div>

      <p className="sc-caption" aria-live="polite">{scene.line}</p>

      <div className="sc-film-controls">
        <button type="button" className="sc-btn sc-btn-sm" onClick={togglePlay} disabled={ended}>
          {playing && !ended ? 'Pause' : 'Play'}
        </button>
        <button type="button" className="sc-btn sc-btn-sm" onClick={replay}>Replay</button>
        <button
          type="button"
          className="sc-btn sc-btn-sm"
          onClick={() => setMuted(!muted)}
          disabled={!supported}
          aria-pressed={muted}
        >
          {supported ? (muted ? 'Voice off' : 'Voice on') : 'Voice unavailable'}
        </button>
        <span className="sc-progress" aria-hidden="true">
          <span className="sc-progress-track"><span className="sc-progress-fill" style={{ width: `${pct}%` }} /></span>
          {Math.round(elapsed / 1000)}s / {Math.round(FILM_TOTAL_MS / 1000)}s
        </span>
      </div>

      {/* Voice quality is very uneven across browsers, so let the listener pick. */}
      {supported && !RECORDED_NARRATION && voiceOptions.length > 0 && (
        <div className="sc-voice">
          <label htmlFor="sc-voice-select">Narrator voice</label>
          <select
            id="sc-voice-select"
            className="sc-select"
            value={chosenVoice ?? voiceOptions[0]?.name ?? ''}
            onChange={(e) => { setChosenVoiceName(e.target.value); stopVoice(); spokenFor.current = -1; }}
          >
            {voiceOptions.map((v) => (
              <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
            ))}
          </select>
          <span style={{ color: 'var(--sc-faint)', fontSize: 11.5 }}>
            Best first. Microsoft &ldquo;Natural&rdquo; voices in Edge sound closest to human.
          </span>
        </div>
      )}

      {!supported && (
        <div className="sc-note sc-note-warn" style={{ marginTop: 14 }}>
          <AlertIcon />
          <span>
            This browser exposes no speech voices, so there is no voice track. The captions above
            and the transcript below carry the full narration — nothing is lost.
          </span>
        </div>
      )}

      {ended && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 11, justifyContent: 'center', marginTop: 20 }}>
          <button type="button" className="sc-btn sc-btn-primary sc-btn-lg" onClick={finish}>
            Start the prototype <ArrowIcon />
          </button>
          <button type="button" className="sc-btn sc-btn-sm" onClick={replay}>Watch again</button>
        </div>
      )}

      <details className="sc-transcript">
        <summary>Read the full transcript</summary>
        <div className="sc-transcript-body">
          {FILM_TRANSCRIPT.split('\n\n').map((p, i) => (
            <p key={i} style={{ marginBottom: 10 }}>{p}</p>
          ))}
          <p style={{ marginTop: 12, color: 'var(--sc-faint)', fontSize: 12 }}>
            <LensIcon style={{ width: 13, height: 13, verticalAlign: '-2px', marginRight: 6 }} />
            This film is a scripted presentation. It calls no API — the working analysis is in the
            prototype that follows.
          </p>
        </div>
      </details>

      <div className="sc-note" style={{ marginTop: 14 }}>
        <InfoIcon />
        <span>
          The example invoice is written for this presentation. It depicts no real company, sender
          or transaction.
        </span>
      </div>

      <p className="sc-sr" aria-live="polite">
        Scene {sceneIndex + 1} of {FILM_SCENES.length}: {scene.label}
      </p>
    </section>
  );
}
