/**
 * The explainer.
 *
 * What the product is, then each capability it actually has, then an
 * invitation to try it. Every scene owns one narration line which is also its
 * caption — the same string, so the voice and the text on screen can never
 * drift apart.
 *
 * The scenes track the shipped product deliberately. An earlier version
 * described a feature set that had moved on, which meant the explainer was
 * quietly selling something the app no longer did. Every claim below points
 * at something a viewer can go and exercise in the next two clicks.
 */

export interface FilmScene {
  id: string;
  /** Short label for the progress rail. */
  label: string;
  /** Kicker shown above the scene title. */
  kicker: string;
  /** On-screen headline for the scene. */
  title: string;
  durationMs: number;
  /** The narration for this scene. Also shown as the caption. */
  en: string;
}

/*
 * Durations are roughly 11 words per second of speech plus a beat to read the
 * slide. They are a backstop, not the clock: a scene advances when its
 * narration finishes, and these only matter when the voice is muted or
 * missing.
 */
export const FILM_SCENES: FilmScene[] = [
  {
    id: 'what',
    label: 'The idea',
    kicker: 'What it is',
    title: 'Know what you are trusting',
    durationMs: 13000,
    en: 'TrustLens AI checks whether a message, a link or a payment request actually deserves your trust — before you act on it.',
  },
  {
    id: 'problem',
    label: 'The problem',
    kicker: 'Why it matters',
    title: 'A warning is not an answer',
    durationMs: 14000,
    en: 'Most tools show a red warning and stop there. That creates worry without telling you what is wrong, or what to do about it.',
  },
  {
    id: 'evidence',
    label: 'Evidence',
    kicker: 'One',
    title: 'It shows you the exact words',
    durationMs: 14500,
    en: 'Every warning quotes the precise phrase that triggered it. You can judge the reasoning yourself instead of trusting a colour.',
  },
  {
    id: 'provenance',
    label: 'Provenance',
    kicker: 'Two',
    title: 'Three kinds of claim, never blended',
    durationMs: 16000,
    en: 'A fixed rule, a check that actually ran, and an AI reading are three different things. They are kept apart, so you always know which one you are looking at.',
  },
  {
    id: 'unknowns',
    label: 'Unknowns',
    kicker: 'Three',
    title: 'It tells you what it could not check',
    durationMs: 15500,
    en: 'A check that did not run is never reported as one that passed. And no warning found is not the same as safe — it only means our rules did not match.',
  },
  {
    id: 'tamil',
    label: 'Tamil',
    kicker: 'Four',
    title: 'It understands Tamil too',
    durationMs: 15500,
    en: 'Scams in India arrive in Tamil written in English letters. "OTP share pannunga" is a demand for your code, and TrustLens reads it as one.',
  },
  {
    id: 'action',
    label: 'Next step',
    kicker: 'Five',
    title: 'One clear thing to do next',
    durationMs: 14000,
    en: 'Every report ends with a concrete step — usually calling your bank on the number printed on your card, never one from the message.',
  },
  {
    id: 'respond',
    label: 'Already happened',
    kicker: 'Six',
    title: 'If it already happened',
    durationMs: 16000,
    en: 'Tell it what you already did and the plan changes. If money has moved, it leads with 1930 — India’s fraud helpline — because the first hours decide whether a transfer can be frozen.',
  },
  {
    id: 'campaigns',
    label: 'Campaigns',
    kicker: 'Seven',
    title: 'One scam reaches thousands',
    durationMs: 16500,
    en: 'The same campaign arrives reworded, from a new number, on a new link. Matching the parts that cannot change connects them — so one person’s report can warn the next.',
  },
  {
    id: 'evidence_doc',
    label: 'Evidence file',
    kicker: 'Eight',
    title: 'Something you can hand over',
    durationMs: 15000,
    en: 'It builds a clean summary for your bank or a cybercrime complaint. You choose what it includes, and it says plainly that it is not an official document.',
  },
  {
    id: 'offline',
    label: 'Offline',
    kicker: 'Nine',
    title: 'It works without internet',
    durationMs: 14500,
    en: 'Your saved reports and the emergency guidance open with no connection at all. You are told which checks are paused — never shown a stale answer as a fresh one.',
  },
  {
    id: 'invite',
    label: 'Your turn',
    kicker: 'Now you try',
    title: 'Check something yourself',
    durationMs: 12000,
    en: 'That is TrustLens AI. Paste a suspicious message and see the whole thing work. Pause. Verify. Then act.',
  },
];

export const FILM_TOTAL_MS = FILM_SCENES.reduce((sum, s) => sum + s.durationMs, 0);

export function sceneStartMs(index: number): number {
  return FILM_SCENES.slice(0, index).reduce((sum, s) => sum + s.durationMs, 0);
}

/** Transcript, derived from the authored strings — never a copy. */
export const FILM_TRANSCRIPT = FILM_SCENES
  .map((s) => `${s.title}\n${s.en}`)
  .join('\n\n---\n\n');
