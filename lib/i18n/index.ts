import { en } from './dictionaries/en';
import { ta } from './dictionaries/ta';
import { hi } from './dictionaries/hi';
import { te } from './dictionaries/te';
import { DEFAULT_LOCALE, type Locale } from './locales';
import type { Dict, DictKey } from './dictionaries/en';

export type { Dict, DictKey };
export * from './locales';

/**
 * The dictionaries, all four loaded.
 *
 * Statically imported rather than split per locale. The whole set is about
 * 14 KB before compression — less than one of the glass cards' shadows — and
 * dynamic import would mean the first paint of a Tamil page either waits for
 * a second request or flashes English first. Neither is worth 10 KB.
 */
const DICTS: Record<Locale, Dict> = { en, ta, hi, te };

export type Translate = (key: DictKey) => string;

/**
 * Builds the lookup for a locale.
 *
 * Missing keys cannot happen — every dictionary is typed against the English
 * one, so a gap is a compile error rather than an English word appearing
 * mid-sentence in Telugu. The runtime fallback is belt and braces for a
 * dictionary loaded dynamically in future.
 */
export function translator(locale: Locale): Translate {
  const dict = DICTS[locale] ?? DICTS[DEFAULT_LOCALE];
  return (key) => dict[key] ?? en[key] ?? key;
}

export function dictionary(locale: Locale): Dict {
  return DICTS[locale] ?? DICTS[DEFAULT_LOCALE];
}
