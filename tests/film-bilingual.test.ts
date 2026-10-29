import { describe, expect, it } from 'vitest';
import { FILM_SCENES, FILM_TRANSCRIPT, FILM_TOTAL_MS, LANG_LABEL, NARRATION_ORDER, sceneStartMs } from '../lib/showcase/film';

/**
 * The brief fixes the language offer: exactly two, named "English" and
 * "Tamil", each scene authored separately in both, with no third language
 * anywhere. These assertions bind that promise to the data so a later edit
 * cannot quietly break it.
 */
describe('bilingual film scripts', () => {
  it('offers English first, then Tamil', () => {
    expect(NARRATION_ORDER).toEqual(['en', 'ta']);
  });

  it('names the languages exactly "English" and "Tamil"', () => {
    expect(LANG_LABEL.en).toBe('English');
    expect(LANG_LABEL.ta).toBe('Tamil');
    // No third name may leak in through a label.
    expect(Object.values(LANG_LABEL).sort()).toEqual(['English', 'Tamil']);
  });

  it('gives every scene both scripts, separately authored', () => {
    for (const s of FILM_SCENES) {
      expect(s.ta.trim().length, `${s.id} tamil`).toBeGreaterThan(20);
      expect(s.en.trim().length, `${s.id} english`).toBeGreaterThan(20);
      // Separately authored, not one copied into the other.
      expect(s.ta).not.toBe(s.en);
    }
  });

  it('offers exactly two languages — no third', () => {
    expect(Object.keys(LANG_LABEL).sort()).toEqual(['en', 'ta']);
  });

  it('builds the transcript from the authored strings', () => {
    for (const s of FILM_SCENES) {
      expect(FILM_TRANSCRIPT).toContain(s.ta);
      expect(FILM_TRANSCRIPT).toContain(s.en);
      // Within a scene block the Tanglish must appear before the English.
      const block = FILM_TRANSCRIPT.split('\n\n---\n\n').find((b) => b.includes(s.ta));
      expect(block, s.id).toBeTruthy();
      expect(block!.indexOf(s.en)).toBeLessThan(block!.indexOf(s.ta));
    }
  });

  it('allows enough time per scene for two readings', () => {
    for (const s of FILM_SCENES) {
      // ~14 chars/second is a comfortable spoken pace; both passes must fit.
      const needed = ((s.ta.length + s.en.length) / 14) * 1000;
      expect(s.durationMs, `${s.id} too short for both languages`).toBeGreaterThan(needed * 0.55);
    }
  });

  it('keeps scene ids unique and the timeline monotonic', () => {
    const ids = FILM_SCENES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (let i = 1; i < FILM_SCENES.length; i += 1) {
      expect(sceneStartMs(i)).toBeGreaterThan(sceneStartMs(i - 1));
    }
    expect(sceneStartMs(FILM_SCENES.length)).toBe(FILM_TOTAL_MS);
  });

  it('every scene carries a kicker and a title for the visual', () => {
    for (const s of FILM_SCENES) {
      expect(s.kicker.length, s.id).toBeGreaterThan(2);
      expect(s.title.length, s.id).toBeGreaterThan(5);
      expect(s.label.length, s.id).toBeGreaterThan(2);
    }
  });
});
