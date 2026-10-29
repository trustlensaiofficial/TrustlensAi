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
  /** Spoken aloud and shown as the caption, verbatim. */
  line: string;
}

export const FILM_SCENES: FilmScene[] = [
  {
    id: 'what',
    label: 'The idea',
    kicker: 'What it is',
    title: 'Know what you are trusting',
    durationMs: 9600,
    line: 'TrustLens AI helps you decide whether a message, a link, or a request deserves your trust — before you act on it.',
  },
  {
    id: 'problem',
    label: 'The problem',
    kicker: 'Why it matters',
    title: 'A warning is not an answer',
    durationMs: 10200,
    line: 'Most tools just show a red warning. That tells you to worry, but it does not tell you what to check, or what to do next.',
  },
  {
    id: 'f1',
    label: 'Evidence',
    kicker: 'Feature one',
    title: 'Evidence you can inspect',
    durationMs: 9800,
    line: 'Feature one. Every warning sign shows the exact words that triggered it, so you can judge the reasoning yourself.',
  },
  {
    id: 'f2',
    label: 'Context',
    kicker: 'Feature two',
    title: 'Rules that fit what you are holding',
    durationMs: 10400,
    line: 'Feature two. Tell it what you have — a job offer, an invoice, a proposal, a link — and the rules change to match it.',
  },
  {
    id: 'f3',
    label: 'Investigation',
    kicker: 'Feature three',
    title: 'A transparent investigation',
    durationMs: 10200,
    line: 'Feature three. Rules read the wording, links are taken apart, and only then does the model interpret what was found.',
  },
  {
    id: 'f4',
    label: 'Provenance',
    kicker: 'Feature four',
    title: 'Three kinds of claim, never blended',
    durationMs: 10600,
    line: 'Feature four. A rule match, a retrieved fact, and a model opinion are three different things — and they are never mixed together.',
  },
  {
    id: 'f5',
    label: 'Uncertainty',
    kicker: 'Feature five',
    title: 'What it could not establish',
    durationMs: 10200,
    line: 'Feature five. It shows you what it could not check, just as clearly as what it could. Silence is never treated as safety.',
  },
  {
    id: 'f6',
    label: 'Next action',
    kicker: 'Feature six',
    title: 'The next safe move',
    durationMs: 11000,
    line: 'Feature six, and the heart of it. Findings become steps you can actually take — like calling your supplier on a number you already had.',
  },
  {
    id: 'f7',
    label: 'The report',
    kicker: 'Feature seven',
    title: 'One report you can keep',
    durationMs: 9400,
    line: 'Feature seven. The whole assessment in one place, with a plain summary you can copy or download.',
  },
  {
    id: 'f8',
    label: 'History',
    kicker: 'Feature eight',
    title: 'Your own history, kept private',
    durationMs: 9800,
    line: 'Feature eight. Your past checks stay in your own browser. There is no endpoint that lists anyone else’s reports.',
  },
  {
    id: 'invite',
    label: 'Your turn',
    kicker: 'Now you try',
    title: 'Open the working prototype',
    durationMs: 8600,
    line: 'That is TrustLens AI. Everything you just saw is live — open the prototype and try it yourself.',
  },
];

export const FILM_TOTAL_MS = FILM_SCENES.reduce((sum, s) => sum + s.durationMs, 0);

export function sceneStartMs(index: number): number {
  return FILM_SCENES.slice(0, index).reduce((sum, s) => sum + s.durationMs, 0);
}

export const FILM_TRANSCRIPT = FILM_SCENES.map((s) => s.line).join('\n\n');
