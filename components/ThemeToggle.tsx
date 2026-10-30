'use client';

import { MoonIcon, SunIcon } from './icons';

/**
 * Light/dark switch.
 *
 * Holds no React state: the current appearance lives on
 * document.documentElement as data-theme, stamped before first paint by the
 * inline script in the root layout, and CSS decides which icon shows. That
 * avoids a hydration mismatch and means the correct icon is in the very
 * first frame rather than appearing after hydration.
 */
export function ThemeToggle() {
  return (
    <button
      type="button"
      className="icon-button"
      aria-label="Switch between light and dark appearance"
      onClick={() => {
        const root = document.documentElement;
        const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
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
