import { describe, expect, it } from 'vitest';
import { MAX_INPUT_LENGTH, buildPreview, classifyInput, validateInput } from '../lib/analysis/normalize';

describe('validateInput', () => {
  it('rejects non-strings and empty input', () => {
    expect(validateInput(undefined).ok).toBe(false);
    expect(validateInput(42).ok).toBe(false);
    expect(validateInput('   ').ok).toBe(false);
  });

  it('rejects input below the minimum length', () => {
    const result = validateInput('ab');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('too_short');
  });

  it('rejects oversized input and reports the limit', () => {
    const result = validateInput('x'.repeat(MAX_INPUT_LENGTH + 1));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('too_long');
  });

  it('accepts and trims valid input', () => {
    const result = validateInput('  hello there  ');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('hello there');
  });

  it('accepts input exactly at the limit', () => {
    expect(validateInput('x'.repeat(MAX_INPUT_LENGTH)).ok).toBe(true);
  });
});

describe('classifyInput', () => {
  it('detects a bare URL', () => {
    expect(classifyInput('https://example.com/login')).toBe('url');
    expect(classifyInput('example.com')).toBe('url');
  });

  it('does not treat a sentence containing a link as a bare URL', () => {
    expect(classifyInput('Please click https://example.com to verify your account')).toBe('message');
  });

  it('detects a message from its markers', () => {
    expect(classifyInput('Dear customer, your account will be blocked. Click to verify.')).toBe('message');
  });

  it('detects a factual claim', () => {
    expect(classifyInput('A new study shows that 80 percent of researchers found this causes harm')).toBe('claim');
  });
});

describe('buildPreview', () => {
  it('collapses whitespace', () => {
    expect(buildPreview('a\n\n  b   c')).toBe('a b c');
  });

  it('truncates long input with an ellipsis', () => {
    const preview = buildPreview('x'.repeat(500));
    expect(preview.length).toBeLessThanOrEqual(280);
    expect(preview.endsWith('…')).toBe(true);
  });
});
