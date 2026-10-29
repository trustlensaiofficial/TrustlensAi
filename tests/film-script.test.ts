import { describe, expect, it } from 'vitest';
import { FILM_SCENES, FILM_TRANSCRIPT, FILM_TOTAL_MS, sceneStartMs } from '../lib/showcase/film';

/**
 * The story is narrated in English only.
 *
 * It previously offered a Tamil pass, but the script was romanised Tamil and
 * every available speech engine read it as mangled English. Shipping a
 * language option that sounds broken is worse than not offering it, so these
 * assertions pin the single-language contract and guard against a second
 * script field creeping back in unnoticed.
 */
describe('story film scripts', () => {
  it('gives every scene a real script', () => {
    for (const s of FILM_SCENES) {
      expect(s.en.trim().length, `${s.id} narration`).toBeGreaterThan(20);
      expect(s.title.trim().length, `${s.id} title`).toBeGreaterThan(3);
      expect(s.kicker.trim().length, `${s.id} kicker`).toBeGreaterThan(2);
    }
  });

  it('carries no second-language field', () => {
    for (const s of FILM_SCENES) {
      expect(Object.keys(s)).not.toContain('ta');
    }
  });

  it('builds the transcript from the authored strings', () => {
    for (const s of FILM_SCENES) {
      expect(FILM_TRANSCRIPT).toContain(s.en);
    }
  });

  it('has unique scene ids and a consistent clock', () => {
    const ids = FILM_SCENES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (let i = 1; i < FILM_SCENES.length; i += 1) {
      expect(sceneStartMs(i)).toBeGreaterThan(sceneStartMs(i - 1));
    }
    expect(sceneStartMs(FILM_SCENES.length)).toBe(FILM_TOTAL_MS);
  });

  it('gives every scene time to be read aloud', () => {
    for (const s of FILM_SCENES) {
      expect(s.durationMs, `${s.id} duration`).toBeGreaterThan(4000);
    }
  });
});
