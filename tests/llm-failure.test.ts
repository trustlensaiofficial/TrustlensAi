import { describe, expect, it } from 'vitest';
import { runContextualAnalysis } from '../lib/analysis/llm';

/**
 * The contextual layer must never throw and never leak provider detail.
 * A failure has to arrive as a degraded status the UI can show honestly.
 */
describe('contextual layer failure handling', () => {
  it('degrades with a reason when no credential is configured', async () => {
    const saved = { g: process.env.AI_GATEWAY_API_KEY, a: process.env.ANTHROPIC_API_KEY };
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      const result = await runContextualAnalysis('hello', 'message', [], []);
      expect(result.status.used).toBe(false);
      expect(result.status.degraded).toBe(true);
      expect(result.status.provider).toBe('none');
      expect(result.status.reason).toBeTruthy();
      expect(result.output).toBeNull();
    } finally {
      if (saved.g) process.env.AI_GATEWAY_API_KEY = saved.g;
      if (saved.a) process.env.ANTHROPIC_API_KEY = saved.a;
    }
  });

  it('never returns raw provider text to the caller', async () => {
    const saved = process.env.ANTHROPIC_API_KEY;
    const savedGw = process.env.AI_GATEWAY_API_KEY;
    delete process.env.AI_GATEWAY_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'sk-ant-definitely-not-valid';
    try {
      const result = await runContextualAnalysis('hello there', 'message', [], []);
      expect(result.status.degraded).toBe(true);
      // The credential must never appear in anything the UI can render.
      expect(JSON.stringify(result)).not.toContain('sk-ant-');
      expect(result.status.reason).toBeTruthy();
    } finally {
      if (saved) process.env.ANTHROPIC_API_KEY = saved; else delete process.env.ANTHROPIC_API_KEY;
      if (savedGw) process.env.AI_GATEWAY_API_KEY = savedGw;
    }
  }, 30_000);
});
