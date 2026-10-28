'use client';

import { MoonIcon, SunIcon } from './icons';

/**
 * Light/dark override on top of the OS preference.
 *
 * Deliberately holds no React state: the current theme lives on
 * document.documentElement as data-theme (set pre-paint by the inline script
 * in the root layout), and CSS decides which icon is visible. That avoids both
 * a hydration mismatch and a setState-in-effect cascade, and it means the
 * correct icon is present in the very first paint.
 */
export function ThemeToggle() {
  return (
    <button
      type="button"
      className="icon-button"
      aria-label="Switch between light and dark appearance"
      onClick={() => {
        const root = document.documentElement;
        const current =
          root.dataset.theme ??
          (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        const next = current === 'dark' ? 'light' : 'dark';
        root.dataset.theme = next;
        try {
          localStorage.setItem('trustlens.theme', next);
        } catch {
          /* the preference simply will not persist */
        }
      }}
    >
      <SunIcon className="theme-icon-sun" />
      <MoonIcon className="theme-icon-moon" />
    </button>
  );
}
