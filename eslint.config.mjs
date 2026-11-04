import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

/**
 * eslint-config-next v16 ships native flat config, so these are spread
 * directly — no FlatCompat wrapper.
 */
const config = [
  { ignores: [
    // Local `vercel build` output. Build artefacts, not project source —
    // linting them produced 2,555 problems that were all noise.
    '.vercel/**',
   '.next/**', 'node_modules/**', 'coverage/**', 'next-env.d.ts'] },
  ...coreWebVitals,
  ...typescript,
];

export default config;
