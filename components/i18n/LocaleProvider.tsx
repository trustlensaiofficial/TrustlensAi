'use client';

import { createContext, useContext, useMemo } from 'react';
import { DEFAULT_LOCALE, translator, type Locale, type Translate } from '@/lib/i18n';

/**
 * The locale, for client components.
 *
 * The value is decided on the server and passed down, so a client component
 * never has to guess and never renders English for a frame before correcting
 * itself. Nothing here reads a cookie or `navigator.language`: two sources of
 * truth for the same question is how an interface ends up half-translated.
 */

interface LocaleValue {
  locale: Locale;
  t: Translate;
}

const LocaleContext = createContext<LocaleValue | null>(null);

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  // Memoised on the locale alone: the translator is a closure over a static
  // object, so rebuilding it per render would invalidate every consumer for
  // no reason.
  const value = useMemo<LocaleValue>(() => ({ locale, t: translator(locale) }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/**
 * Falls back to English outside a provider rather than throwing.
 *
 * A missing provider should degrade to a readable screen, not a crash — this
 * is a product people open in an emergency, and a blank page because of a
 * context mistake is the worst possible failure.
 */
export function useLocale(): LocaleValue {
  const value = useContext(LocaleContext);
  return value ?? { locale: DEFAULT_LOCALE, t: translator(DEFAULT_LOCALE) };
}

/** The common case: just the lookup. */
export function useT(): Translate {
  return useLocale().t;
}
