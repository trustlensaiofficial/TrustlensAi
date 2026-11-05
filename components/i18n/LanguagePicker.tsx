'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { LOCALES, LOCALE_COOKIE, LOCALE_INFO, type Locale } from '@/lib/i18n';
import { useLocale } from './LocaleProvider';
import { Check, Language } from '@/components/ui/icons';

/**
 * Choosing an interface language.
 *
 * The choice is written to a cookie and the server re-renders. That is slower
 * than swapping strings on the client, and it is the right trade: every
 * server-rendered string, every `lang` attribute and every metadata title
 * changes together, instead of the client-rendered half of the product
 * switching while the server-rendered half stays in English.
 *
 * `router.refresh()` inside a transition keeps the current screen on-screen
 * and interactive while the new render streams in — no spinner, no scroll
 * jump, no losing what someone had typed into the check box.
 */
export function LanguagePicker() {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [chosen, setChosen] = useState<Locale | null>(null);

  const choose = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      setChosen(next);
      /*
       * A year, Lax, and path-wide.
       *
       * Not HttpOnly: this is a display preference the client also reads, and
       * there is nothing in it worth protecting. Lax rather than None because
       * the language someone reads the product in has no business travelling
       * on a cross-site request.
       */
      document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
      startTransition(() => router.refresh());
    },
    [locale, router],
  );

  return (
    <div className="lang">
      <div className="lang-head">
        <span className="lang-icon" aria-hidden="true"><Language /></span>
        <span className="dock-row-text">
          <strong>{t('lang.title')}</strong>
          <small>{t('lang.sub')}</small>
        </span>
      </div>

      <ul className="lang-list" role="radiogroup" aria-label={t('lang.title')}>
        {LOCALES.map((code) => {
          const info = LOCALE_INFO[code];
          const active = code === locale;
          return (
            <li key={code}>
              <button
                type="button"
                role="radio"
                aria-checked={active}
                className={`lang-option${active ? ' is-active' : ''}`}
                // `lang` on the button itself, so the browser picks the right
                // font and a screen reader switches voice for this label.
                lang={info.tag}
                disabled={pending && chosen === code}
                onClick={() => choose(code)}
              >
                <span className="lang-label">
                  <strong>{info.label}</strong>
                  <small lang="en">{info.english}</small>
                </span>
                {active ? <Check /> : null}
              </button>
            </li>
          );
        })}
      </ul>

      {/*
        Said where the choice is made, which is the only place it cannot be
        missed. Translating the interface does not teach the detector a
        language, and letting someone infer otherwise would be exactly the
        kind of unearned claim this product exists to catch.
      */}
      <p className="lang-note">{t('lang.detectionNote')}</p>
      <p className="lang-planned">{t('lang.planned')}</p>
    </div>
  );
}
