/**
 * The translations, held to the things that actually break.
 *
 * TypeScript already guarantees every dictionary has every key. What it
 * cannot see is a key that was *copied* rather than translated, a dashboard
 * card with no entry, or the one sentence in this product that must never be
 * softened in any language.
 */

import { describe, expect, it } from 'vitest';
import { en } from '../lib/i18n/dictionaries/en';
import { ta } from '../lib/i18n/dictionaries/ta';
import { hi } from '../lib/i18n/dictionaries/hi';
import { te } from '../lib/i18n/dictionaries/te';
import { LOCALES, LOCALE_INFO, negotiateLocale, translator } from '../lib/i18n';
import { FEATURES } from '../lib/features';
import type { DictKey } from '../lib/i18n';

const TRANSLATED = { ta, hi, te } as const;

/** Names that are the same in every language, and must not be "translated". */
const INVARIANT: DictKey[] = [
  'app.name',
  'app.footerTeam',
  'share.whatsapp',
  'share.telegram',
];

const SCRIPT = {
  ta: /[஀-௿]/,
  hi: /[ऀ-ॿ]/,
  te: /[ఀ-౿]/,
} as const;

describe('every dictionary is complete', () => {
  const keys = Object.keys(en) as DictKey[];

  for (const [code, dict] of Object.entries(TRANSLATED)) {
    it(`${code} has every key, with nothing empty`, () => {
      for (const key of keys) {
        expect(dict[key], `${code} is missing ${key}`).toBeTruthy();
        expect(dict[key].trim(), `${code}.${key} is blank`).not.toBe('');
      }
    });

    it(`${code} has no keys English does not`, () => {
      // A stale key is a string nothing renders and nobody maintains.
      expect(Object.keys(dict).filter((k) => !(k in en))).toEqual([]);
    });
  }
});

describe('the translations are translations', () => {
  for (const [code, dict] of Object.entries(TRANSLATED)) {
    it(`${code} does not leave English copy in place`, () => {
      const copied = (Object.keys(en) as DictKey[])
        .filter((key) => !INVARIANT.includes(key))
        .filter((key) => dict[key] === en[key]);
      // An untranslated string is worse than a missing one: it looks finished.
      expect(copied).toEqual([]);
    });

    it(`${code} is written in its own script`, () => {
      const pattern = SCRIPT[code as keyof typeof SCRIPT];
      const latinOnly = (Object.keys(en) as DictKey[])
        .filter((key) => !INVARIANT.includes(key))
        // Product nouns legitimately stay in Latin (OTP, UPI, PDF), so a
        // string is only suspect when it has no native script at all.
        .filter((key) => !pattern.test(dict[key]));
      expect(latinOnly).toEqual([]);
    });
  }
});

describe('every dashboard card can be rendered in every language', () => {
  for (const locale of LOCALES) {
    it(`${locale} has a title, blurb and action for all ten cards`, () => {
      const t = translator(locale);
      for (const feature of FEATURES) {
        for (const part of ['title', 'blurb', 'action'] as const) {
          const key = `feature.${feature.id}.${part}` as DictKey;
          // If this fails, a card was added to lib/features.tsx without a
          // dictionary entry and the grid would render a raw key.
          expect(t(key), `${locale} ${key}`).not.toBe(key);
        }
      }
    });
  }
});

describe('the sentence that must survive every translation', () => {
  for (const locale of LOCALES) {
    it(`${locale} still refuses to call a clean result safe`, () => {
      const t = translator(locale);
      const headline = t('verdict.no_signals_detected');
      const sub = t('verdict.no_signals_detected.sub');
      // "No rules matched" is not "safe". Every language has to say so, and
      // the subtitle is the only place it is said.
      expect(sub.length, `${locale} subtitle is too short to carry the caveat`).toBeGreaterThan(40);
      expect(headline).toBeTruthy();
      // And it must tell them what to do instead.
      expect(sub).toMatch(/verify|சரிபா|जाँच|सरिचू|సరిచూ/i);
    });
  }
});

describe('what each language claims about detection', () => {
  it('names Telugu as interface-only', () => {
    // Translating a button does not teach the detector a language, and the
    // type carries that so a surface can show it.
    expect(LOCALE_INFO.te.detectionCoverage).toBe('none');
  });

  it('names English, Tamil and Hindi as covered', () => {
    // These three are the ones the benchmark corpus measures.
    for (const code of ['en', 'ta', 'hi'] as const) {
      expect(LOCALE_INFO[code].detectionCoverage).toBe('full');
    }
  });

  it('every locale carries a tag and an endonym', () => {
    for (const code of LOCALES) {
      expect(LOCALE_INFO[code].tag).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
      expect(LOCALE_INFO[code].label).toBeTruthy();
      expect(LOCALE_INFO[code].english).toBeTruthy();
    }
  });
});

describe('picking a language for someone who has not chosen', () => {
  it('honours quality values rather than order', () => {
    expect(negotiateLocale('en;q=0.8, ta;q=0.9')).toBe('ta');
  });

  it('matches a regional tag to its base language', () => {
    expect(negotiateLocale('ta-IN,ta;q=0.9')).toBe('ta');
    expect(negotiateLocale('hi-IN')).toBe('hi');
  });

  it('falls back to English for an unsupported or absent header', () => {
    expect(negotiateLocale('fr-FR,fr')).toBe('en');
    expect(negotiateLocale(null)).toBe('en');
    expect(negotiateLocale('')).toBe('en');
  });
});
