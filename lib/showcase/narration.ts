'use client';

/**
 * Voice narration over the Web Speech API.
 *
 * Deliberately a module-level singleton: the browser has exactly one speech
 * queue, so two components each holding their own controller would talk over
 * each other. Every speak() cancels first, which is what stops repeated
 * clicks from stacking voices.
 *
 * Availability is checked at call time, not import time — Safari populates
 * its voice list asynchronously, and some embedded webviews expose the API
 * but never fire events. Captions and the transcript are always rendered, so
 * nothing here is load-bearing for comprehension.
 */

export type NarrationState = 'unsupported' | 'idle' | 'speaking' | 'paused';

let currentUtterance: SpeechSynthesisUtterance | null = null;
const listeners = new Set<() => void>();
let state: NarrationState = 'idle';
let muted = false;

function emit() {
  for (const l of listeners) l();
}

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
  return () => listeners.delete(onChange);
}

export function getNarrationState(): NarrationState {
  if (!isSupported()) return 'unsupported';
  return state;
}

export function getServerNarrationState(): NarrationState {
  return 'idle';
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(next: boolean): void {
  muted = next;
  if (muted) stop();
  emit();
}

/** Picks a natural-sounding English voice when one is available. */
function pickVoice(s: SpeechSynthesis): SpeechSynthesisVoice | null {
  const voices = s.getVoices();
  if (voices.length === 0) return null;
  const preferred = [
    'Google UK English Female', 'Google US English', 'Samantha',
    'Microsoft Aria Online (Natural) - English (United States)',
    'Daniel', 'Karen',
  ];
  for (const name of preferred) {
    const match = voices.find((v) => v.name === name);
    if (match) return match;
  }
  return voices.find((v) => v.lang.startsWith('en')) ?? voices[0] ?? null;
}

/**
 * Speaks one line. Cancels anything in flight first so narration can never
 * overlap, which is the most common failure of Web Speech in a demo.
 */
export function speak(text: string, onEnd?: () => void): void {
  const s = synth();
  if (!s || muted || !isSupported()) {
    onEnd?.();
    return;
  }
  s.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(s);
  if (voice) u.voice = voice;
  u.rate = 0.98;
  u.pitch = 1;
  u.volume = 1;
  u.onend = () => {
    if (currentUtterance === u) {
      currentUtterance = null;
      state = 'idle';
      emit();
    }
    onEnd?.();
  };
  u.onerror = () => {
    if (currentUtterance === u) {
      currentUtterance = null;
      state = 'idle';
      emit();
    }
    // Do not surface this: the captions already carry the content.
    onEnd?.();
  };
  currentUtterance = u;
  state = 'speaking';
  emit();
  s.speak(u);
}

export function pause(): void {
  const s = synth();
  if (!s || state !== 'speaking') return;
  s.pause();
  state = 'paused';
  emit();
}

export function resume(): void {
  const s = synth();
  if (!s || state !== 'paused') return;
  s.resume();
  state = 'speaking';
  emit();
}

/** Always safe to call — used on unmount, skip, replay and close. */
export function stop(): void {
  const s = synth();
  currentUtterance = null;
  if (s) s.cancel();
  if (state !== 'idle') {
    state = 'idle';
    emit();
  }
}
