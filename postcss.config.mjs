/**
 * Tailwind v4 runs as a PostCSS plugin. Next picks this file up automatically.
 *
 * Only the new design-system surfaces use Tailwind utilities; the older
 * hand-written CSS keeps working beside it because `app/tailwind.css`
 * deliberately does not pull in Tailwind's preflight reset.
 */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
