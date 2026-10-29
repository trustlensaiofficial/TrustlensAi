/**
 * The explainer film.
 *
 * Structure follows the brief: a short statement of what the product is,
 * then every feature explained one at a time, then the invitation to open the
 * prototype. Each scene owns its narration line and its caption — they are
 * the same string, so voice and text can never drift apart.
 *
 * The film is a scripted presentation. It calls no API; the working analysis
 * lives in the tour that follows.
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
  /** The narration for this scene. Also shown as the caption, so voice
   *  and text can never drift apart. */
  en: string;
}

export const FILM_SCENES: FilmScene[] = [
  {
    id: 'what',
    label: 'The idea',
    kicker: 'What it is',
    title: 'Know what you are trusting',
    durationMs: 14800,
    en: 'TrustLens AI checks whether a message, a link or a request actually deserves your trust.',
  },
  {
    id: 'problem',
    label: 'The problem',
    kicker: 'Why it matters',
    title: 'A warning is not an answer',
    durationMs: 15800,
    en: 'Most tools only show a red warning. That creates worry, but it does not tell you what to do.',
  },
  {
    id: 'f1',
    label: 'Evidence',
    kicker: 'Feature one',
    title: 'Evidence you can inspect',
    durationMs: 15100,
    en: 'Feature one. Every warning sign shows the exact words that triggered it, so you can judge it yourself.',
  },
  {
    id: 'f2',
    label: 'Context',
    kicker: 'Feature two',
    title: 'Rules that fit what you are holding',
    durationMs: 16100,
    en: 'Feature two. Choose what you are holding, and the rules change to match it.',
  },
  {
    id: 'f3',
    label: 'Investigation',
    kicker: 'Feature three',
    title: 'A transparent investigation',
    durationMs: 15800,
    en: 'Feature three. Rules run first, links are taken apart, and only then does the model interpret.',
  },
  {
    id: 'f4',
    label: 'Provenance',
    kicker: 'Feature four',
    title: 'Three kinds of claim, never blended',
    durationMs: 16400,
    en: 'Feature four. A rule match, a verified fact and a model opinion stay clearly separate.',
  },
  {
    id: 'f5',
    label: 'Uncertainty',
    kicker: 'Feature five',
    title: 'What it could not establish',
    durationMs: 15800,
    en: 'Feature five. It states what it could not check. No warning does not mean verified safe.',
  },
  {
    id: 'f6',
    label: 'Next action',
    kicker: 'Feature six',
    title: 'The next safe move',
    durationMs: 17000,
    en: 'Feature six, the heart of it. Findings become safe next steps, like calling the number printed on your card.',
  },
  {
    id: 'f7',
    label: 'The report',
    kicker: 'Feature seven',
    title: 'One report you can keep',
    durationMs: 14500,
    en: 'Feature seven. One complete report, which you can copy or download.',
  },
  {
    id: 'f8',
    label: 'History',
    kicker: 'Feature eight',
    title: 'Your own history, kept private',
    durationMs: 15100,
    en: 'Feature eight. Your past checks stay in your own browser, where nobody else can list them.',
  },
  {
    id: 'invite',
    label: 'Your turn',
    kicker: 'Now you try',
    title: 'Open the working prototype',
    durationMs: 13300,
    en: 'That is TrustLens AI. Now open the prototype and try it yourself.',
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

