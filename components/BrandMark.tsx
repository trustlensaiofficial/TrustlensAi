/**
 * The TrustLens AI mark, inlined so it needs no network request, scales
 * cleanly and renders identically in both themes.
 *
 * NOTE: this is a faithful reproduction of the supplied TrustLens AI logo
 * (shield + eye + globe + magnifier, cyan-to-violet gradient). The original
 * raster asset could not be located on this machine. The same artwork also
 * lives at public/logo-mark.svg and app/icon.svg (the browser-tab icon); if
 * you have the official file, replace those two and swap this component's
 * body for an <img> pointing at it.
 *
 * Gradient ids are suffixed per instance so multiple marks on one page cannot
 * collide — SVG defs share a document-wide namespace.
 */
export function BrandMark({ size = 32, idSuffix = 'hdr' }: { size?: number; idSuffix?: string }) {
  const g = `tl-shield-${idSuffix}`;
  const l = `tl-lens-${idSuffix}`;
  const o = `tl-globe-${idSuffix}`;
  const c = `tl-clip-${idSuffix}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={g} x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#22D3EE" />
          <stop offset=".5" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id={l} x1="18" y1="16" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E8F6FF" />
          <stop offset="1" stopColor="#9DD6F5" />
        </linearGradient>
        <radialGradient id={o} cx=".35" cy=".3" r=".85">
          <stop offset="0" stopColor="#4FC3F7" />
          <stop offset="1" stopColor="#1565C0" />
        </radialGradient>
        <clipPath id={c}>
          <circle cx="24" cy="24" r="5.1" />
        </clipPath>
      </defs>

      <path
        d="M24 3.6 38.9 9v12.3c0 9.1-6.2 16.4-14.9 19.6C15.3 37.7 9.1 30.4 9.1 21.3V9L24 3.6Z"
        fill="none" stroke={`url(#${g})`} strokeWidth="3.1" strokeLinejoin="round" strokeLinecap="round"
      />
      <path
        d="M12.6 24c3.3-4.9 7.1-7.3 11.4-7.3S32.1 19.1 35.4 24c-3.3 4.9-7.1 7.3-11.4 7.3S15.9 28.9 12.6 24Z"
        fill="none" stroke={`url(#${l})`} strokeWidth="2.5" strokeLinejoin="round"
      />
      <circle cx="24" cy="24" r="5.1" fill={`url(#${o})`} />
      <g clipPath={`url(#${c})`} fill="none" stroke="#BFE9FF" strokeWidth=".85" opacity=".9">
        <ellipse cx="24" cy="24" rx="2.2" ry="5.1" />
        <path d="M18.9 22.1h10.2M18.9 25.9h10.2" />
      </g>
      <circle cx="24" cy="24" r="5.1" fill="none" stroke="#E8F6FF" strokeWidth="1.05" />
      <path d="M31.6 31.6 38 38" stroke={`url(#${g})`} strokeWidth="3.4" strokeLinecap="round" />
      <g fill={`url(#${g})`}>
        <rect x="37.4" y="7.1" width="3.4" height="3.4" rx=".7" />
        <rect x="41.9" y="11.4" width="2.6" height="2.6" rx=".6" opacity=".8" />
        <rect x="37.9" y="13.9" width="2.2" height="2.2" rx=".5" opacity=".6" />
      </g>
    </svg>
  );
}
