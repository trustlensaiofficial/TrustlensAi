/**
 * The analysis request body, against the contract.
 *
 * This exists because the two diverged silently. The route shipped
 * `allowCloudAI`; docs/openapi.yaml documents `allowCloudAi`, which is the
 * casing every other field uses. A client built strictly from the contract
 * would have had its flag dropped as an unknown key and defaulted to false —
 * no error, no warning, just a feature that never switched on. That is
 * precisely the "two owners building against different APIs" failure the
 * transition brief warns about, so the behaviour is pinned here.
 */

import { describe, expect, it } from 'vitest';
import { AnalysisRequestBody, resolveAllowCloudAi } from '../lib/api/analyses';

describe('both spellings of the cloud-AI flag are accepted', () => {
  it('takes the contract spelling', () => {
    const parsed = AnalysisRequestBody.safeParse({ text: 'hello', allowCloudAi: true });
    expect(parsed.success).toBe(true);
    expect(resolveAllowCloudAi(parsed.data!)).toBe(true);
  });

  it('still takes the legacy spelling, so nothing already sending it breaks', () => {
    const parsed = AnalysisRequestBody.safeParse({ text: 'hello', allowCloudAI: true });
    expect(parsed.success).toBe(true);
    expect(resolveAllowCloudAi(parsed.data!)).toBe(true);
  });

  it('enables the layer when either is true', () => {
    expect(resolveAllowCloudAi({ allowCloudAi: true, allowCloudAI: false })).toBe(true);
    expect(resolveAllowCloudAi({ allowCloudAi: false, allowCloudAI: true })).toBe(true);
  });
});

describe('the default is off, which is the whole point', () => {
  it('is off when neither spelling is present', () => {
    const parsed = AnalysisRequestBody.safeParse({ text: 'hello' });
    expect(parsed.success).toBe(true);
    expect(resolveAllowCloudAi(parsed.data!)).toBe(false);
  });

  it('is off when both are explicitly false', () => {
    expect(resolveAllowCloudAi({ allowCloudAi: false, allowCloudAI: false })).toBe(false);
  });

  it('is off for an empty body', () => {
    expect(resolveAllowCloudAi({})).toBe(false);
  });

  it('never treats a truthy non-boolean as consent', () => {
    // zod rejects the wrong type outright, so a string "true" cannot enable
    // a layer that sends the user's message to a model provider.
    expect(AnalysisRequestBody.safeParse({ text: 'x', allowCloudAi: 'true' }).success).toBe(false);
    expect(AnalysisRequestBody.safeParse({ text: 'x', allowCloudAI: 1 }).success).toBe(false);
  });
});

describe('live checks stay off by default too', () => {
  it('defaults to false', () => {
    const parsed = AnalysisRequestBody.safeParse({ text: 'hello' });
    expect(parsed.data!.liveChecks).toBe(false);
  });
});

describe('the QR payload is bounded', () => {
  it('accepts a real UPI URI', () => {
    const parsed = AnalysisRequestBody.safeParse({
      text: 'scan this',
      qrPayload: 'upi://pay?pa=someone@okaxis&am=100&cu=INR',
    });
    expect(parsed.success).toBe(true);
  });

  it('refuses an oversized payload', () => {
    // Attacker-influenced text gets a bound like any other input.
    const parsed = AnalysisRequestBody.safeParse({ text: 'x', qrPayload: 'a'.repeat(2_049) });
    expect(parsed.success).toBe(false);
  });
});
