/**
 * Interface languages.
 *
 * Separate from detection languages, deliberately and permanently. The
 * detector's measured coverage is English, Tamil (both scripts) and Hindi
 * (both scripts) — translating a button into Telugu does not teach the rules
 * a word of Telugu, and a product that let someone infer otherwise would be
 * making exactly the kind of unearned claim it exists to catch.
 *
 * `detectionCoverage` carries that distinction into the type system, so any
 * surface that shows a language can also show the truth about it. See
 * `docs/DETECTION_BENCHMARK.md` for the measured figures.
 */

export const LOCALES = ['en', 'ta', 'hi', 'te'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** The cookie, so a server render already knows the language — no flash. */
export const LOCALE_COOKIE = 'trustlens.lang';

export interface LocaleInfo {
  /** Endonym first: people look for their language in their own script. */
  label: string;
  /** The same name in English, for anyone who has landed on the wrong one. */
  english: string;
  /** BCP 47, for the `lang` attribute and for `toLocaleString`. */
  tag: string;
  /**
   * Whether the detection rules have measured coverage in this language.
   *
   * 'full'    — rules exist and are measured in the benchmark corpus.
   * 'none'    — the interface is translated; the detector reads the message
   *             with its English, Tamil and Hindi rules only.
   */
  detectionCoverage: 'full' | 'none';
}

export const LOCALE_INFO: Record<Locale, LocaleInfo> = {
  en: { label: 'English', english: 'English (India)', tag: 'en-IN', detectionCoverage: 'full' },
  ta: { label: 'தமிழ்', english: 'Tamil', tag: 'ta-IN', detectionCoverage: 'full' },
  hi: { label: 'हिन्दी', english: 'Hindi', tag: 'hi-IN', detectionCoverage: 'full' },
  te: { label: 'తెలుగు', english: 'Telugu', tag: 'te-IN', detectionCoverage: 'none' },
};

/**
 * Languages the architecture is ready for but which have no dictionary yet.
 *
 * Listed rather than hidden: someone looking for Kannada should learn that it
 * is planned, not conclude the product ignores them. They are not offered in
 * the picker, because an option that switches nothing is worse than an
 * honest absence.
 */
export const PLANNED_LOCALES = ['Kannada', 'Malayalam', 'Bengali', 'Marathi'] as const;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Picks the best locale from an Accept-Language header.
 *
 * Only used when there is no stored choice. Quality values are honoured, so a
 * browser asking for `ta;q=0.9, en;q=0.8` gets Tamil rather than whichever
 * appeared first.
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.find((p) => p.trim().startsWith('q='));
      return { tag: (tag ?? '').trim().toLowerCase(), q: q ? Number(q.split('=')[1]) || 0 : 1 };
    })
    .filter((entry) => entry.tag)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    // `ta-IN` and `ta` both resolve to Tamil.
    const base = tag.split('-')[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
