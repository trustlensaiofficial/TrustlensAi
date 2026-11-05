import 'server-only';
import { cookies, headers } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, negotiateLocale, type Locale } from './locales';
import { translator, type Translate } from './index';

/**
 * The locale for a server render.
 *
 * Read from a cookie rather than the URL. A `/ta/check` prefix would be the
 * textbook answer, but it rewrites every link in the product, breaks every
 * URL anyone has already shared, and gives a scammer a second plausible shape
 * for a TrustLens address to imitate. A cookie is read before the first byte
 * is sent, so the server renders the right language with no flash and no
 * client round trip.
 *
 * With no stored choice, Accept-Language decides — someone whose phone is
 * already in Tamil should not have to find a picker.
 */
export async function getLocale(): Promise<Locale> {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(stored)) return stored;
  try {
    return negotiateLocale((await headers()).get('accept-language'));
  } catch {
    return DEFAULT_LOCALE;
  }
}

/** The locale and its lookup, for a server component. */
export async function getTranslations(): Promise<{ locale: Locale; t: Translate }> {
  const locale = await getLocale();
  return { locale, t: translator(locale) };
}
