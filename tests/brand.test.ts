/**
 * The brand assets, held to the one thing that actually breaks.
 *
 * `app/icon.svg` and every PNG under `public/brand/` are generated from
 * `lib/brand/mark.json` by `scripts/build-brand.mjs`. Nothing stops someone
 * editing the geometry and forgetting to run the script — and the symptom is
 * invisible in development, because the app renders the JSON directly while
 * the home-screen icon keeps the old drawing. That exact drift had already
 * happened once before the generator existed.
 *
 * So: assert the generated files still carry the current geometry, and assert
 * the two properties the install depends on (a plate behind the icon, the
 * maskable variant inside the safe zone).
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import mark from '../lib/brand/mark.json';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

const ICON = read('app/icon.svg');
const MASKABLE = read('public/brand/icon-maskable.svg');
const PLAIN = read('public/brand/mark.svg');

describe('the generated SVGs match the geometry they came from', () => {
  const SHAPES: Array<[string, string]> = [
    ['shield', mark.shield.d],
    ['eye', mark.eye.d],
    ['magnifier handle', mark.handle.d],
  ];

  for (const [name, d] of SHAPES) {
    it(`carries the current ${name} path`, () => {
      // If this fails, lib/brand/mark.json changed and the generator was not
      // re-run: `node scripts/build-brand.mjs`.
      expect(ICON, 'app/icon.svg').toContain(d);
      expect(MASKABLE, 'maskable').toContain(d);
      expect(PLAIN, 'mark.svg').toContain(d);
    });
  }

  it('carries the current globe', () => {
    const circle = `cx="${mark.globe.cx}" cy="${mark.globe.cy}" r="${mark.globe.r}"`;
    expect(ICON).toContain(circle);
  });

  it('carries every mote', () => {
    for (const d of mark.motes) {
      expect(ICON, `mote at ${d.x},${d.y}`).toContain(`x="${d.x}" y="${d.y}"`);
    }
  });

  it('is marked generated, so nobody hand-edits it', () => {
    for (const [name, svg] of [['icon', ICON], ['maskable', MASKABLE], ['mark', PLAIN]] as const) {
      expect(svg.slice(0, 200), name).toContain('GENERATED');
    }
  });
});

describe('what the install actually needs', () => {
  it('the home-screen icon carries its own dark ground', () => {
    // Without this the cyan stroke lands on the user's wallpaper and the icon
    // stops being readable — the single most visible way an install looks broken.
    expect(ICON).toContain(mark.plate.fill);
    expect(ICON).toMatch(/<rect width="64" height="64" rx="\d+" fill="#060D1C"\/>/);
  });

  it('the maskable variant bleeds to the edge and keeps the art inside the safe zone', () => {
    // Android crops to the launcher's own shape. A rounded plate would show
    // its corners being cut; art outside the middle 80% would lose the
    // magnifier and the motes.
    expect(MASKABLE).toContain('<rect width="64" height="64" fill="#060D1C"/>');
    const scale = MASKABLE.match(/scale\(([\d.]+)\)/)?.[1];
    expect(scale, 'maskable scale').toBeDefined();
    expect(Number(scale)).toBeLessThanOrEqual(0.8);
  });

  it('the plain mark has no ground, so it can sit on any surface', () => {
    expect(PLAIN).not.toContain('<rect width="64" height="64"');
  });

  it('every icon the manifest names is actually generated', () => {
    const manifest = JSON.parse(read('public/manifest.webmanifest')) as {
      icons: Array<{ src: string; purpose: string }>;
    };
    for (const icon of manifest.icons) {
      const path = icon.src.replace(/^\//, '');
      // An icon named but missing is a silent install failure: the browser
      // falls back to a screenshot of the page or a generic globe.
      expect(() => read(path.startsWith('icon.svg') ? `app/${path}` : `public/${path}`), icon.src).not.toThrow();
    }
  });

  it('offers both a maskable and a non-maskable raster', () => {
    const manifest = JSON.parse(read('public/manifest.webmanifest')) as {
      icons: Array<{ src: string; purpose: string; type: string }>;
    };
    const raster = manifest.icons.filter((i) => i.type === 'image/png');
    expect(raster.some((i) => i.purpose === 'maskable'), 'a maskable PNG').toBe(true);
    expect(raster.some((i) => i.purpose === 'any'), 'a plain PNG').toBe(true);
    // iOS will not read SVG for a home-screen icon at all, so PNG is not optional.
    expect(raster.length).toBeGreaterThanOrEqual(4);
  });
});
