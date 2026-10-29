/**
 * The explainer film: five scenes, roughly 32 seconds end to end.
 *
 * Each scene carries its own narration line and caption so voice and text stay
 * aligned scene by scene. The film is a scripted demonstration — it does not
 * call the analysis API — and the UI labels it as such.
 */

export interface FilmScene {
  id: string;
  /** Short label shown in the progress rail. */
  label: string;
  durationMs: number;
  /** Spoken aloud and shown as the caption. Kept identical so they can never drift. */
  line: string;
}

export const FILM_SCENES: FilmScene[] = [
  {
    id: 'problem',
    label: 'The problem',
    durationMs: 8200,
    line: 'Every day, people encounter suspicious job offers, unexpected payment requests, and links that may not be what they seem.',
  },
  {
    id: 'investigation',
    label: 'The investigation',
    durationMs: 6600,
    line: 'TrustLens AI examines the wording, the links, and the structure of what you received.',
  },
  {
    id: 'evidence',
    label: 'The evidence',
    durationMs: 7400,
    line: 'It shows you the warning signs, the evidence behind them, and what still could not be verified.',
  },
  {
    id: 'action',
    label: 'The next step',
    durationMs: 7000,
    line: 'But it goes beyond a warning. It guides you toward practical next steps, so you can make a more informed decision.',
  },
  {
    id: 'invitation',
    label: 'The invitation',
    durationMs: 5600,
    line: 'Welcome to TrustLens AI. Explore the investigation, discover the evidence, and find your next safe action.',
  },
];

export const FILM_TOTAL_MS = FILM_SCENES.reduce((sum, s) => sum + s.durationMs, 0);

/** Cumulative start time of each scene, for the progress rail. */
export function sceneStartMs(index: number): number {
  return FILM_SCENES.slice(0, index).reduce((sum, s) => sum + s.durationMs, 0);
}

/** Full narration as one block, for the accessible transcript. */
export const FILM_TRANSCRIPT = FILM_SCENES.map((s) => s.line).join(' ');
