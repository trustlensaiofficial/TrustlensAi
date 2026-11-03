'use client';

import { Moon, Sun } from './icons';

/**
 * Holds no React state: the theme lives on documentElement as data-theme,
 * stamped before first paint by the inline script in the root layout, and CSS
 * picks the icon. That avoids a hydration mismatch and means the right icon is
 * in the very first frame.
 */
export function ThemeToggle() {
  return (
    <button
      type="button"
      className="btn btn-ghost icon-btn"
      aria-label="Switch between light and dark appearance"
      onClick={() => {
        const root = document.documentElement;
        const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
        root.dataset.theme = next;
        try { localStorage.setItem('trustlens.theme', next); } catch { /* not persisted */ }
      }}
    >
      <Sun className="icon-sun" />
      <Moon className="icon-moon" />
    </button>
  );
}
