'use client';

/**
 * Narration for the explainer film.
 *
 * TWO SOURCES, in priority order:
 *
 * 1. RECORDED AUDIO — a real human recording, if you supply one. This is the
 *    only way to get a genuinely human voice; browser speech is synthetic by
 *    definition. To enable: record one clip per scene, save them as
 *    /public/narration/<sceneId>.mp3 (ids are in lib/showcase/film.ts), and
 *    flip RECORDED_NARRATION below to true. The player prefers them
 *    automatically and falls back to speech if a file fails to load.
 *
 * 2. SPEECH SYNTHESIS — the fallback. Quality varies enormously by browser,
 *    so voices are ranked rather than taken in whatever order the platform
 *    returns: Microsoft "Natural" voices (Edge) and Apple's premium voices are
 *    close to human; the default macOS novelty voices are not, and are
 *    excluded outright. The listener can also pick a voice themselves.
 *
 * Deliberately a module-level singleton: the browser has one speech queue, so
 * two components each holding their own controller would talk over each other.
 * Every speak() cancels first, which is what stops repeated clicks stacking.
 */

export type NarrationState = 'unsupported' | 'idle' | 'speaking' | 'paused';

/** Set true once /public/narration/<sceneId>.mp3 files exist. */
export const RECORDED_NARRATION = false;
export const RECORDED_PATH = (sceneId: string) => `/narration/${sceneId}.mp3`;

let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentAudio: HTMLAudioElement | null = null;
const listeners = new Set<() => void>();
let state: NarrationState = 'idle';
let muted = false;
let chosenVoiceName: string | null = null;

function emit() { for (const l of listeners) l(); }

function synth(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null;
  return window.speechSynthesis ?? null;
}

export function isSupported(): boolean {
  const s = synth();
  return Boolean(s && typeof window.SpeechSynthesisUtterance === 'function');
}

export function subscribeNarration(onChange: () => void): () => void {
  listeners.add(onChange);
  // Voice lists populate asynchronously in Safari and Chrome.
  const s = synth();
  const onVoices = () => emit();
  s?.addEventListener?.('voiceschanged', onVoices);
  return () => {
    listeners.delete(onChange);
    s?.removeEventListener?.('voiceschanged', onVoices);
  };
}

export function getNarrationState(): NarrationState {
  if (!isSupported() && !RECORDED_NARRATION) return 'unsupported';
  return state;
}
export function getServerNarrationState(): NarrationState { return 'idle'; }

export function isMuted(): boolean { return muted; }
export function setMuted(next: boolean): void {
  muted = next;
  if (muted) stop();
  emit();
}

/* ------------------------------------------------------------------ voices */

/** Novelty and legacy voices that would make the film sound like a toy. */
const EXCLUDED = /^(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|grandma|grandpa|rocko|shelley|sandy|flo|eddy|reed|junior|kathy|fred|ralph|victoria|agnes|bruce|princess)/i;

/**
 * Higher is more human. Ranked from what each engine actually sounds like,
 * not from the order the platform happens to return them in.
 */
function scoreVoice(v: SpeechSynthesisVoice): number {
  const n = v.name.toLowerCase();
  if (EXCLUDED.test(v.name)) return -1;
  if (!v.lang.toLowerCase().startsWith('en')) return -1;

  let score = 0;
  // Microsoft neural voices are the closest to human available in a browser.
  if (n.includes('natural')) score += 100;
  if (/\b(aria|jenny|guy|emma|brian|libby|ryan|sonia|michelle|roger)\b/.test(n) && n.includes('microsoft')) score += 40;
  // Google's are clearly synthetic but smooth and well-paced.
  if (n.startsWith('google')) score += 55;
  if (n.includes('google') && n.includes('female')) score += 8;
  // Apple's premium/enhanced tiers are a large step up from the defaults.
  if (n.includes('premium')) score += 60;
  if (n.includes('enhanced')) score += 45;
  if (/\b(ava|allison|samantha|serena|zoe|evan|nathan|noelle|tom|susan|karen|moira|tessa|daniel)\b/.test(n)) score += 25;
  // Prefer the listener's own locale family, then US/GB.
  if (v.lang === 'en-US' || v.lang === 'en-GB') score += 10;
  if (v.localService) score += 4;
  return score;
}

/** Voices worth offering, best first. */
export function listVoices(): SpeechSynthesisVoice[] {
  const s = synth();
  if (!s) return [];
  return s.getVoices()
    .map((v) => ({ v, score: scoreVoice(v) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.v);
}

export function getChosenVoiceName(): string | null { return chosenVoiceName; }

export function setChosenVoiceName(name: string | null): void {
  chosenVoiceName = name;
  try { if (name) localStorage.setItem('trustlens.voice', name); } catch { /* not persisted */ }
  emit();
}

function restoreChoice(): void {
  if (chosenVoiceName !== null) return;
  try {
    const saved = localStorage.getItem('trustlens.voice');
    if (saved) chosenVoiceName = saved;
  } catch { /* nothing to restore */ }
}

function pickVoice(): SpeechSynthesisVoice | null {
  restoreChoice();
  const all = listVoices();
  if (all.length === 0) return null;
  if (chosenVoiceName) {
    const exact = all.find((v) => v.name === chosenVoiceName);
    if (exact) return exact;
  }
  return all[0] ?? null;
}

/* ------------------------------------------------------------------ speak  */

/**
 * Speaks one scene. Prefers a recording when one is configured.
 * `sceneId` is only used to locate the recorded file.
 */
export function speak(text: string, sceneId?: string, onEnd?: () => void): void {
  stop();
  if (muted) { onEnd?.(); return; }

  if (RECORDED_NARRATION && sceneId && typeof Audio !== 'undefined') {
    const audio = new Audio(RECORDED_PATH(sceneId));
    audio.preload = 'auto';
    currentAudio = audio;
    state = 'speaking';
    emit();
    audio.onended = () => {
      if (currentAudio === audio) { currentAudio = null; state = 'idle'; emit(); }
      onEnd?.();
    };
    // A missing or unplayable file falls through to speech rather than
    // leaving the scene silent.
    audio.onerror = () => {
      if (currentAudio === audio) currentAudio = null;
      speakWithSynth(text, onEnd);
    };
    void audio.play().catch(() => {
      if (currentAudio === audio) currentAudio = null;
      speakWithSynth(text, onEnd);
    });
    return;
  }

  speakWithSynth(text, onEnd);
}

function speakWithSynth(text: string, onEnd?: () => void): void {
  const s = synth();
  if (!s || !isSupported() || muted) { onEnd?.(); return; }
  s.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) { u.voice = voice; u.lang = voice.lang; }
  // Normal conversational pace. Slower reads as laboured, faster as clipped.
  u.rate = 1.0;
  u.pitch = 1.0;
  u.volume = 1;
  u.onend = () => {
    if (currentUtterance === u) { currentUtterance = null; state = 'idle'; emit(); }
    onEnd?.();
  };
  u.onerror = () => {
    if (currentUtterance === u) { currentUtterance = null; state = 'idle'; emit(); }
    onEnd?.();
  };
  currentUtterance = u;
  state = 'speaking';
  emit();
  s.speak(u);
}

export function pause(): void {
  if (currentAudio) { currentAudio.pause(); state = 'paused'; emit(); return; }
  const s = synth();
  if (!s || state !== 'speaking') return;
  s.pause();
  state = 'paused';
  emit();
}

export function resume(): void {
  if (currentAudio) { void currentAudio.play().catch(() => {}); state = 'speaking'; emit(); return; }
  const s = synth();
  if (!s || state !== 'paused') return;
  s.resume();
  state = 'speaking';
  emit();
}

/** Always safe to call — used on unmount, skip, replay and close. */
export function stop(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio = null;
  }
  currentUtterance = null;
  synth()?.cancel();
  if (state !== 'idle') { state = 'idle'; emit(); }
}
