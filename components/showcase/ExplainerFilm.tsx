'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { FILM_SCENES, FILM_TOTAL_MS, FILM_TRANSCRIPT, sceneStartMs } from '@/lib/showcase/film';
import {
  getNarrationState,
  getServerNarrationState,
  isMuted,
  pause as pauseVoice,
  resume as resumeVoice,
  setMuted,
  speak,
  stop as stopVoice,
  subscribeNarration,
} from '@/lib/showcase/narration';
import { AlertIcon, ArrowIcon, CheckIcon, InfoIcon, LensIcon, ShieldIcon } from '../icons';

const TICK_MS = 100;

/** Visuals for each scene. Pure presentation — nothing here calls the API. */
function SceneVisual({ id, elapsedInScene }: { id: string; elapsedInScene: number }) {
  const after = (ms: number) => elapsedInScene >= ms;

  if (id === 'problem') {
    return (
      <div className="sc-scene">
        <div className="sc-msg">
          <div className="sc-msg-top">
            <span className="sc-msg-avatar" />
            <div>
              <div className="sc-msg-from">Accounts Receivable</div>
              <div className="sc-msg-meta">to you · just now</div>
            </div>
          </div>
          <p className="sc-msg-body">
            Please find attached invoice INV-20418, now overdue. Please note{' '}
            {after(2200) ? <mark>our bank details have changed</mark> : 'our bank details have changed'}{' '}
            following our recent banking migration. As this payment is already past due, we would
            appreciate {after(3600) ? <mark>same-day settlement</mark> : 'same-day settlement'}.{' '}
            {after(5000) ? <mark>There is no need to call to confirm.</mark> : 'There is no need to call to confirm.'}
          </p>
        </div>
        <p style={{ textAlign: 'center', marginTop: 18, color: 'var(--sc-faint)', fontSize: 12.5 }}>
          A real supplier. A real invoice. One detail changed.
        </p>
      </div>
    );
  }

  if (id === 'investigation') {
    const rows = [
      { t: 0, label: 'Reading the wording', detail: '17 deterministic rules' },
      { t: 1400, label: 'Parsing any links', detail: 'domain structure, offline' },
      { t: 2800, label: 'Checking what can be checked', detail: 'DNS, page metadata' },
      { t: 4200, label: 'Handing findings to the model', detail: 'evidence only' },
    ];
    return (
      <div className="sc-scene">
        <div className="sc-scan">
          {rows.filter((r) => after(r.t)).map((r) => (
            <div className="sc-scan-row" key={r.label}>
              <span className="sc-dot" />
              <b>{r.label}</b>
              <span style={{ marginLeft: 'auto', fontSize: 11.5 }}>{r.detail}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === 'evidence') {
    return (
      <div className="sc-scene">
        <div className="sc-prov">
          {after(400) && (
            <div className="sc-prov-card sc-prov-known">
              <h4>Observed</h4>
              <p>The message asks you not to phone to confirm — the one check this fraud cannot survive.</p>
            </div>
          )}
          {after(2000) && (
            <div className="sc-prov-card sc-prov-infer">
              <h4>Interpreted</h4>
              <p>A late change of payment details plus urgency is consistent with invoice redirection.</p>
            </div>
          )}
          {after(3800) && (
            <div className="sc-prov-card sc-prov-unknown">
              <h4>Not established</h4>
              <p>Whether the sender is really your supplier. Email authenticity was not verified.</p>
            </div>
          )}
        </div>
        <p style={{ textAlign: 'center', marginTop: 18, color: 'var(--sc-faint)', fontSize: 12.5 }}>
          Three different kinds of claim — never blended into one verdict.
        </p>
      </div>
    );
  }

  if (id === 'action') {
    const steps = [
      'Call the supplier on a number you already held — not one from this email.',
      'Hold the payment until that call is done, even though it says urgent.',
      'Check the account name matches their registered company name.',
    ];
    return (
      <div className="sc-scene">
        <div className="sc-steps">
          {steps.map((s, i) => after(i * 1500) && (
            <div className="sc-step" key={s}>
              <span className="sc-step-n">{i + 1}</span>
              <p>{s}</p>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', marginTop: 18, color: 'var(--sc-ice)', fontSize: 12.5 }}>
          Not a warning. A next move.
        </p>
      </div>
    );
  }

  return (
    <div className="sc-scene" style={{ textAlign: 'center' }}>
      <div style={{ display: 'grid', placeItems: 'center', gap: 18 }}>
        <ShieldIcon style={{ width: 46, height: 46, color: 'var(--sc-ice)' }} />
        <h3 style={{ fontSize: 'clamp(20px, 3.4vw, 30px)' }}>
          See the signal. Understand the evidence. Know your next move.
        </h3>
        <p style={{ color: 'var(--sc-muted)', fontSize: 14, maxWidth: '44ch', lineHeight: 1.65 }}>
          Everything you just watched is a live part of the prototype. Explore it yourself.
        </p>
      </div>
    </div>
  );
}

export function ExplainerFilm({ onFinish, onSkip }: { onFinish: () => void; onSkip: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const spokenFor = useRef<number>(-1);
  // Derived, not stored: the film is over exactly when the clock says so.
  // Keeping this as state would mean a setState inside an effect purely to
  // mirror a value already present.
  const ended = elapsed >= FILM_TOTAL_MS;
  const voiceState = useSyncExternalStore(subscribeNarration, getNarrationState, getServerNarrationState);
  const muted = useSyncExternalStore(subscribeNarration, isMuted, () => false);
  const supported = voiceState !== 'unsupported';

  // Derive the active scene from elapsed time so captions, visuals, rail and
  // narration all read from one source of truth.
  let sceneIndex = 0;
  let acc = 0;
  for (let i = 0; i < FILM_SCENES.length; i += 1) {
    const d = FILM_SCENES[i]?.durationMs ?? 0;
    if (elapsed < acc + d) { sceneIndex = i; break; }
    acc += d;
    sceneIndex = i;
  }
  const scene = FILM_SCENES[sceneIndex]!;
  const elapsedInScene = elapsed - sceneStartMs(sceneIndex);

  // The clock.
  useEffect(() => {
    if (!playing || ended) return;
    const t = setInterval(() => {
      setElapsed((e) => {
        const next = e + TICK_MS;
        if (next >= FILM_TOTAL_MS) return FILM_TOTAL_MS;
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(t);
  }, [playing, ended]);

  // One narration line per scene. speak() cancels anything in flight, so a
  // fast scrub can never stack voices.
  useEffect(() => {
    if (!playing || ended || muted || !supported) return;
    if (spokenFor.current === sceneIndex) return;
    spokenFor.current = sceneIndex;
    speak(scene.line);
  }, [sceneIndex, playing, ended, muted, supported, scene.line]);

  // Always silence on unmount — leaving the page must not keep talking.
  useEffect(() => () => stopVoice(), []);

  const replay = useCallback(() => {
    stopVoice();
    spokenFor.current = -1;
    setElapsed(0);
    setPlaying(true);
  }, []);

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      const next = !p;
      if (next) {
        if (voiceState === 'paused') resumeVoice();
      } else {
        pauseVoice();
      }
      return next;
    });
  }, [voiceState]);

  const skip = useCallback(() => {
    stopVoice();
    onSkip();
  }, [onSkip]);

  const finish = useCallback(() => {
    stopVoice();
    onFinish();
  }, [onFinish]);

  const pct = Math.min(100, Math.round((elapsed / FILM_TOTAL_MS) * 100));

  return (
    <section className="sc-film sc-shell" aria-labelledby="sc-film-title">
      <div className="sc-film-head">
        <div>
          <p className="sc-eyebrow"><i /> Scripted demonstration</p>
          <h2 id="sc-film-title" style={{ fontSize: 'clamp(19px, 2.4vw, 25px)', marginTop: 8 }}>
            How TrustLens AI works
          </h2>
        </div>
        <button type="button" className="sc-btn sc-btn-ghost sc-btn-sm" onClick={skip}>
          Skip to features
        </button>
      </div>

      {/* progress rail */}
      <div>
        <div className="sc-rail">
          {FILM_SCENES.map((s, i) => {
            const start = sceneStartMs(i);
            const local = Math.min(Math.max(elapsed - start, 0), s.durationMs);
            return (
              <div className="sc-rail-seg" key={s.id}>
                <div className="sc-rail-fill" style={{ width: `${(local / s.durationMs) * 100}%` }} />
              </div>
            );
          })}
        </div>
        <div className="sc-rail-labels" aria-hidden="true">
          {FILM_SCENES.map((s, i) => (
            <span className="sc-rail-label" key={s.id} data-on={i === sceneIndex}>{s.label}</span>
          ))}
        </div>
      </div>

      <div className="sc-stage">
        <SceneVisual id={scene.id} elapsedInScene={elapsedInScene} />
      </div>

      {/* captions — always present, whether or not voice is available */}
      <p className="sc-caption" aria-live="polite">{scene.line}</p>

      <div className="sc-film-controls">
        {!ended ? (
          <>
            <button type="button" className="sc-btn sc-btn-sm" onClick={togglePlay}>
              {playing ? 'Pause' : 'Play'}
            </button>
            <button type="button" className="sc-btn sc-btn-sm" onClick={replay}>Replay</button>
          </>
        ) : (
          <button type="button" className="sc-btn sc-btn-sm" onClick={replay}>Replay film</button>
        )}

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

      {!supported && (
        <div className="sc-note sc-note-warn" style={{ marginTop: 14 }}>
          <AlertIcon />
          <span>
            This browser does not expose speech synthesis, so there is no voice track. The captions
            above and the transcript below carry the full narration — nothing is lost.
          </span>
        </div>
      )}

      {ended && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 11, justifyContent: 'center', marginTop: 18 }}>
          <button type="button" className="sc-btn sc-btn-primary sc-btn-lg" onClick={finish}>
            Explore the prototype <ArrowIcon />
          </button>
        </div>
      )}

      <details className="sc-transcript">
        <summary>Read the transcript</summary>
        <div className="sc-transcript-body">
          <p>{FILM_TRANSCRIPT}</p>
          <p style={{ marginTop: 12, color: 'var(--sc-faint)', fontSize: 12 }}>
            <LensIcon style={{ width: 13, height: 13, verticalAlign: '-2px', marginRight: 6 }} />
            This film is a scripted demonstration. It does not call the analysis API — the working
            analysis is in the feature tour that follows.
          </p>
        </div>
      </details>

      <div className="sc-note" style={{ marginTop: 14 }}>
        <InfoIcon />
        <span>
          The example invoice is written for this demonstration. It does not depict any real
          company, sender or transaction.
        </span>
      </div>

      <p className="sc-sr" aria-live="polite">
        Scene {sceneIndex + 1} of {FILM_SCENES.length}: {scene.label}
      </p>
      {ended && (
        <p className="sc-sr" role="status">
          <CheckIcon /> Film complete.
        </p>
      )}
    </section>
  );
}
