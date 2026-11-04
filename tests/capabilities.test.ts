/**
 * Capability reporting.
 *
 * These tests exist because the failure mode here is not a crash — it is a
 * reassuring lie. A capability shown as available when it is not, or an
 * unsupported one shown with no explanation, is worse than an error page: the
 * user plans around it.
 */

import { describe, expect, it } from 'vitest';
import {
  describeCapabilities,
  platformFromRequest,
  type CapabilityContext,
  type CapabilityKey,
  type Platform,
} from '../lib/capabilities';

const base: Omit<CapabilityContext, 'platform'> = {
  cloudAiResponding: false,
  cloudAiReason: 'The provider refused the request.',
  accountSyncEnabled: true,
};

const PLATFORMS: Platform[] = ['web', 'android', 'ios'];

function get(platform: Platform, key: CapabilityKey, over: Partial<CapabilityContext> = {}) {
  const list = describeCapabilities({ ...base, platform, ...over });
  const found = list.find((c) => c.key === key);
  if (!found) throw new Error(`no capability ${key}`);
  return found;
}

describe('invariants that hold on every platform', () => {
  it('always explains itself when something is not available', () => {
    for (const platform of PLATFORMS) {
      for (const cap of describeCapabilities({ ...base, platform })) {
        if (cap.state === 'available') continue;
        expect(cap.reason, `${platform}/${cap.key} has no reason`).toBeTruthy();
        expect(cap.reason!.length, `${platform}/${cap.key} reason is too short to be useful`).toBeGreaterThan(20);
      }
    }
  });

  it('names a platform API for anything it says is available', () => {
    for (const platform of PLATFORMS) {
      for (const cap of describeCapabilities({ ...base, platform })) {
        if (cap.state !== 'available') continue;
        // If we cannot name the mechanism, we should not be claiming it.
        expect(cap.mechanism, `${platform}/${cap.key} is available with no named mechanism`).toBeTruthy();
      }
    }
  });

  it('names no mechanism where the platform provides none', () => {
    for (const platform of PLATFORMS) {
      for (const cap of describeCapabilities({ ...base, platform })) {
        if (cap.state !== 'unsupported_platform') continue;
        expect(cap.mechanism, `${platform}/${cap.key} claims a mechanism it cannot have`).toBeNull();
      }
    }
  });

  it('reports the same set of keys everywhere, so nothing is quietly omitted', () => {
    const keys = PLATFORMS.map((p) => describeCapabilities({ ...base, platform: p }).map((c) => c.key).sort());
    expect(keys[0]).toEqual(keys[1]);
    expect(keys[1]).toEqual(keys[2]);
    expect(keys[0]!.length).toBe(8);
  });

  it('never reports a capability as safe-sounding without limits where limits exist', () => {
    // Deterministic rules are the easiest thing to oversell, so they must
    // always carry the statement that no match is not a verification.
    for (const platform of PLATFORMS) {
      const rules = get(platform, 'deterministic_rules');
      expect(rules.limits.join(' ')).toMatch(/not a verification|is not a verification/i);
    }
  });
});

describe('notification monitoring, stated honestly', () => {
  it('is impossible on iOS and says so without implying a setting', () => {
    const cap = get('ios', 'notification_monitoring');
    expect(cap.state).toBe('unsupported_platform');
    expect(cap.reason).toMatch(/does not let any app read other apps/i);
    /*
     * It must not read as an instruction. "There is no permission that would
     * enable this" is correct — it is a negation. What would be wrong is
     * sending the user to Settings to look for a switch that does not exist.
     */
    expect(cap.reason).not.toMatch(/in Settings|turn (it |this )?on|you (can |must )?(allow|grant|enable)/i);
  });

  it('is impossible on the web', () => {
    expect(get('web', 'notification_monitoring').state).toBe('unsupported_platform');
  });

  it('on Android, admits the OS hands over every app and we do the filtering', () => {
    const cap = get('android', 'notification_monitoring');
    expect(cap.state).toBe('permission_required');
    expect(cap.mechanism).toBe('NotificationListenerService');

    // The claim we are forbidden from making is "we only see bank messages".
    const limits = cap.limits.join(' ');
    expect(limits).toMatch(/every app/i);
    expect(limits).toMatch(/applied by TrustLens, not by the operating system/i);
    expect(limits).toMatch(/hidden|truncated|redacted/i);
  });
});

describe('call screening', () => {
  it('states the five-second deadline, which is why no AI is in that path', () => {
    const cap = get('android', 'call_screening');
    expect(cap.mechanism).toMatch(/CallScreeningService/);
    const limits = cap.limits.join(' ');
    expect(limits).toMatch(/five seconds/i);
    expect(limits).toMatch(/no network lookup or AI/i);
    expect(limits).toMatch(/never recorded/i);
  });

  it('does not pretend iOS can look a number up mid-ring', () => {
    const cap = get('ios', 'call_screening');
    expect(cap.mechanism).toMatch(/CXCallDirectoryExtension/);
    expect(cap.limits.join(' ')).toMatch(/supplied ahead of time|does not permit a live lookup/i);
  });

  it('is absent in a browser', () => {
    expect(get('web', 'call_screening').state).toBe('unsupported_platform');
  });
});

describe('SMS filtering', () => {
  it('on iOS, limits itself to unknown senders and excludes iMessage', () => {
    const cap = get('ios', 'sms_filtering');
    expect(cap.mechanism).toMatch(/ILMessageFilterExtension/);
    const limits = cap.limits.join(' ');
    expect(limits).toMatch(/not in your Contacts/i);
    expect(limits).toMatch(/iMessage is never included/i);
    expect(limits).toMatch(/RCS/);
  });

  it('on Android, says we chose not to ask rather than that it is impossible', () => {
    const cap = get('android', 'sms_filtering');
    // Android *can* do this; we decline it. Reporting it as unsupported would
    // be inaccurate in the other direction.
    expect(cap.state).toBe('unavailable');
    expect(cap.reason).toMatch(/does not ask for SMS access/i);
    expect(cap.reason).toMatch(/entire inbox is not needed/i);
  });
});

describe('cloud AI reflects a probe, not a configured key', () => {
  it('is unavailable with the provider reason when the probe failed', () => {
    const cap = get('web', 'cloud_ai', { cloudAiResponding: false, cloudAiReason: 'Billing is blocked.' });
    expect(cap.state).toBe('unavailable');
    expect(cap.reason).toBe('Billing is blocked.');
  });

  it('falls back to a reason that names what still works', () => {
    const cap = get('web', 'cloud_ai', { cloudAiResponding: false, cloudAiReason: undefined });
    expect(cap.reason).toMatch(/Fixed rules, link analysis, payment reading/i);
  });

  it('is available only when the provider actually answered', () => {
    const cap = get('web', 'cloud_ai', { cloudAiResponding: true });
    expect(cap.state).toBe('available');
    expect(cap.reason).toBeNull();
  });

  it('is off by default on every platform', () => {
    for (const platform of PLATFORMS) {
      expect(get(platform, 'cloud_ai', { cloudAiResponding: true }).limits.join(' ')).toMatch(/Off unless you turn it on/i);
    }
  });
});

describe('account sync', () => {
  it('is unavailable with its reason when persistence is not configured', () => {
    const cap = get('web', 'account_sync', {
      accountSyncEnabled: false,
      accountSyncReason: 'No server key is configured.',
    });
    expect(cap.state).toBe('unavailable');
    expect(cap.reason).toBe('No server key is configured.');
  });

  it('states that signing in is never required to run an analysis', () => {
    expect(get('web', 'account_sync').limits.join(' ')).toMatch(/never required/i);
  });
});

describe('platform detection', () => {
  it('takes an explicit declaration from a native client', () => {
    expect(platformFromRequest(new Headers({ 'x-trustlens-platform': 'android' }))).toBe('android');
    expect(platformFromRequest(new Headers({ 'x-trustlens-platform': 'iOS' }))).toBe('ios');
  });

  it('defaults to web rather than guessing native from a user agent', () => {
    // A WebView inside our own Android app is still the web product until it
    // declares otherwise. Guessing would overstate what is available.
    const ua = new Headers({
      'user-agent': 'Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 Chrome/142 Mobile Safari/537.36',
    });
    expect(platformFromRequest(ua)).toBe('web');
    expect(platformFromRequest(new Headers())).toBe('web');
  });

  it('ignores an unrecognised declaration', () => {
    expect(platformFromRequest(new Headers({ 'x-trustlens-platform': 'windows-phone' }))).toBe('web');
  });
});
