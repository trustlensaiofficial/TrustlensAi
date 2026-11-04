/**
 * What this product can actually do, per operating system.
 *
 * This is a feature, not a diagnostics page. A user on iPhone must be able to
 * find out that message monitoring is impossible on their phone rather than
 * assuming it is merely switched off — and a user on Android must learn that
 * notification access hands us notifications from *every* app, which we then
 * filter, because the OS offers no bank-messages-only permission.
 *
 * Two rules the module exists to enforce:
 *
 *  1. **Every capability names the exact platform API behind it.** If there is
 *     no documented, permitted mechanism, the capability does not exist. No
 *     accessibility scraping, no reading another app's storage, nothing that
 *     touches end-to-end encryption.
 *  2. **There is no aggregate green tick.** Capabilities differ per platform
 *     and per grant, and a single badge hides precisely the information a user
 *     needs. `docs/PLATFORM_CAPABILITIES.md` is the long form of this file.
 */

export type CapabilityKey =
  | 'deterministic_rules'
  | 'live_url_checks'
  | 'cloud_ai'
  | 'qr_parsing'
  | 'account_sync'
  | 'notification_monitoring'
  | 'call_screening'
  | 'sms_filtering';

export type CapabilityState =
  | 'available'
  | 'permission_required'
  | 'unsupported_platform'
  | 'degraded'
  | 'paused'
  | 'unavailable';

export type Platform = 'web' | 'android' | 'ios';

export interface Capability {
  key: CapabilityKey;
  state: CapabilityState;
  /** Required whenever state is not `available`. Enforced by test. */
  reason: string | null;
  /**
   * The exact platform API this rests on, or null where the platform provides
   * none. Named so a claim can be checked against the OS documentation rather
   * than taken on trust.
   */
  mechanism: string | null;
  /** What this specifically cannot see, where that is the important part. */
  limits: string[];
  lastCheckedAt: string;
}

/** Runtime facts the server knows; passed in so this module stays pure. */
export interface CapabilityContext {
  platform: Platform;
  /** Whether the AI provider actually answered a probe, not whether a key exists. */
  cloudAiResponding: boolean;
  cloudAiReason?: string | undefined;
  /** Whether report persistence is configured. */
  accountSyncEnabled: boolean;
  accountSyncReason?: string | undefined;
}

const NOTIFICATION_LIMITS = [
  'Notification previews can be hidden, truncated or redacted by the sending app or by the user, and a muted conversation may post nothing at all.',
  'Android grants access to notifications from every app. The restriction to the apps you choose is applied by TrustLens, not by the operating system.',
  'A message that posts no notification is never seen.',
];

const CALL_SCREENING_LIMITS = [
  'Only the incoming number is visible. Call audio is never recorded and no voice analysis is performed.',
  'The screening service must answer within about five seconds, so no network lookup or AI runs in that path — only a list already on the device.',
  'Android allows one call-screening app at a time. Taking the role would replace whichever app currently holds it.',
];

/**
 * The per-platform answer.
 *
 * Written as data rather than branches so that adding a platform means adding
 * a column, and so a reviewer can read the whole honest matrix at once.
 */
function platformEntry(
  key: CapabilityKey,
  platform: Platform,
): { state: CapabilityState; reason: string | null; mechanism: string | null; limits: string[] } {
  switch (key) {
    case 'qr_parsing':
      return platform === 'web'
        ? {
            state: 'available',
            reason: null,
            mechanism: 'Browser barcode decoding, in the page',
            limits: ['The code is read on your device. The image is not uploaded — only the text the code contained.'],
          }
        : platform === 'android'
          ? {
              state: 'available',
              reason: null,
              mechanism: 'ML Kit barcode scanning, on-device',
              limits: ['Camera access is requested only while a scan is open, and picking an existing image is always offered instead.'],
            }
          : {
              state: 'available',
              reason: null,
              mechanism: 'Vision framework, on-device',
              limits: ['Camera access is requested only while a scan is open, and picking an existing image is always offered instead.'],
            };

    case 'notification_monitoring':
      if (platform === 'android') {
        return {
          state: 'permission_required',
          reason:
            'Android can deliver notifications to TrustLens once you allow it in Settings. Until then, sharing a message to TrustLens does the same job.',
          mechanism: 'NotificationListenerService',
          limits: NOTIFICATION_LIMITS,
        };
      }
      if (platform === 'ios') {
        return {
          state: 'unsupported_platform',
          reason:
            'iOS does not let any app read other apps’ notifications. There is no permission that would enable this, so no app on your iPhone can do it — including ours.',
          mechanism: null,
          limits: ['Use the share sheet to send a message to TrustLens instead.'],
        };
      }
      return {
        state: 'unsupported_platform',
        reason: 'A web page cannot read operating-system notifications. No browser offers an API for it.',
        mechanism: null,
        limits: ['Paste or upload the message instead.'],
      };

    case 'call_screening':
      if (platform === 'android') {
        return {
          state: 'permission_required',
          reason: 'Android can show TrustLens an incoming number before it rings, once you grant the call-screening role.',
          mechanism: 'CallScreeningService with ROLE_CALL_SCREENING',
          limits: CALL_SCREENING_LIMITS,
        };
      }
      if (platform === 'ios') {
        return {
          state: 'permission_required',
          reason: 'iOS can label or block calls from a list TrustLens supplies in advance, once you enable it in Settings.',
          mechanism: 'CallKit CXCallDirectoryExtension',
          limits: [
            'The list is supplied ahead of time. iOS does not permit a live lookup while the phone is ringing.',
            'Call contents are never available.',
          ],
        };
      }
      return {
        state: 'unsupported_platform',
        reason: 'A browser has no access to telephony.',
        mechanism: null,
        limits: [],
      };

    case 'sms_filtering':
      if (platform === 'ios') {
        return {
          state: 'permission_required',
          reason: 'iOS can pass TrustLens texts from unknown senders once you enable SMS filtering in Settings.',
          mechanism: 'IdentityLookup ILMessageFilterExtension',
          limits: [
            'Only SMS and MMS from senders not in your Contacts. Nothing from a saved contact is ever passed to the extension.',
            'iMessage is never included, in any form. Neither is RCS.',
          ],
        };
      }
      if (platform === 'android') {
        return {
          state: 'unavailable',
          reason:
            'TrustLens does not ask for SMS access on Android. The permission is restricted to apps that act as your default messaging app, and reading your entire inbox is not needed for this product to work.',
          mechanism: null,
          limits: ['Share a specific message to TrustLens instead, or let notification access cover it.'],
        };
      }
      return {
        state: 'unsupported_platform',
        reason: 'A browser cannot read text messages.',
        mechanism: null,
        limits: [],
      };

    case 'deterministic_rules':
      return {
        state: 'available',
        reason: null,
        mechanism: 'Fixed pattern rules, run server-side',
        limits: [
          'Pattern rules match known wording. A scam phrased unusually, written in an unsupported language, or sent as an image can pass them.',
          'No rule matching means our specific tests did not fire. It is not a verification that the content is genuine.',
        ],
      };

    case 'live_url_checks':
      return {
        state: 'available',
        reason: null,
        mechanism: 'Server-side DNS and HTTP retrieval, behind an SSRF guard',
        limits: [
          'Off unless you turn it on for an analysis, because it contacts the link.',
          'A site can serve us something different from what it serves you.',
        ],
      };

    // Handled by the caller, which knows the runtime state.
    case 'cloud_ai':
    case 'account_sync':
      return { state: 'unavailable', reason: null, mechanism: null, limits: [] };
  }
}

/**
 * The capability list for one platform and runtime state.
 *
 * `cloud_ai` reflects a real probe rather than the presence of a key: a
 * provider that refuses every call on billing is not an available capability,
 * and reporting it as one puts a tick next to something that does not work.
 */
export function describeCapabilities(ctx: CapabilityContext): Capability[] {
  const at = new Date().toISOString();
  const keys: CapabilityKey[] = [
    'deterministic_rules',
    'qr_parsing',
    'live_url_checks',
    'cloud_ai',
    'account_sync',
    'notification_monitoring',
    'sms_filtering',
    'call_screening',
  ];

  return keys.map((key) => {
    if (key === 'cloud_ai') {
      return {
        key,
        state: ctx.cloudAiResponding ? 'available' : 'unavailable',
        reason: ctx.cloudAiResponding
          ? null
          : (ctx.cloudAiReason ??
            'The AI provider is not answering requests. Fixed rules, link analysis, payment reading and the response guidance are unaffected.'),
        mechanism: 'Vercel AI Gateway',
        limits: [
          'Off unless you turn it on, because it sends the text to a model provider.',
          'Its output is labelled as inference and is never treated as a source of fact.',
        ],
        lastCheckedAt: at,
      };
    }

    if (key === 'account_sync') {
      return {
        key,
        state: ctx.accountSyncEnabled ? 'available' : 'unavailable',
        reason: ctx.accountSyncEnabled
          ? null
          : (ctx.accountSyncReason ?? 'Account storage is not configured on this deployment.'),
        mechanism: 'Supabase Postgres with row-level security',
        limits: [
          'Nothing is stored to your account unless you ask for it. Guest analyses stay in this browser.',
          'Signing in is never required to run an analysis.',
        ],
        lastCheckedAt: at,
      };
    }

    const entry = platformEntry(key, ctx.platform);
    return { key, ...entry, lastCheckedAt: at };
  });
}

/** Reads the client platform from a request. Defaults to web, never guesses native. */
export function platformFromRequest(headers: Headers): Platform {
  const declared = headers.get('x-trustlens-platform')?.trim().toLowerCase();
  if (declared === 'android' || declared === 'ios' || declared === 'web') return declared;

  /*
   * Falls back to the user agent, and only for the unambiguous cases. A
   * WebView inside our own Android app is still the web product unless it
   * declares otherwise, so guessing 'android' from the UA would overstate what
   * is available — the header is how a native client identifies itself.
   */
  return 'web';
}
