'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import GlassCard from '@/components/ui/glass-card';
import { LogoMark } from '@/components/brand/LogoMark';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import { safeNextPath, siteOrigin } from '@/lib/auth/config';
import { Alert, Arrow, Check, Fingerprint, Lock } from '@/components/ui/icons';

type Busy = null | 'google' | 'passkey';

/**
 * Sign-in: Google and passkeys only.
 *
 * No email and password, deliberately. A product about credential theft
 * should not create another password for someone to reuse, and both methods
 * here resist exactly the phishing TrustLens exists to catch.
 *
 * Signing in is never required. It decides only whether reports follow you
 * between devices, so this screen always offers a way onward rather than
 * standing as a gate in front of the product.
 */
export function SignIn({ next, initialError }: { next: string; initialError?: string }) {
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  /*
   * Set when the browser refuses the credential because the relying-party id
   * does not cover this origin.
   *
   * That is a configuration fact, not a transient failure: it will fail
   * identically every time until someone changes a dashboard field. Letting
   * the button stay live invites a frustrating loop of tapping, waiting for
   * the system sheet, and being refused — so after the first refusal the
   * route is retired for the session and the explanation stays on screen.
   *
   * Deliberately NOT probed on mount. Reading the relying-party id means
   * asking the server for a real challenge, and spending a network request on
   * every visitor to pre-empt a problem most of them will never meet is the
   * wrong trade.
   */
  const [passkeyUnavailable, setPasskeyUnavailable] = useState(false);

  const supabase = getBrowserSupabase();
  const target = safeNextPath(next, '/home');

  const withGoogle = useCallback(async () => {
    if (!supabase) {
      setError('Sign-in is not configured on this deployment.');
      return;
    }
    setBusy('google');
    setError(null);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      // Built from configuration, never a request header: an attacker-set
      // Host would otherwise mint a callback pointing at their own domain.
      options: { redirectTo: `${siteOrigin()}/auth/callback?next=${encodeURIComponent(target)}` },
    });
    if (err) {
      setBusy(null);
      setError(
        /provider/i.test(err.message)
          ? 'Google sign-in is not enabled for this project yet.'
          : 'Google sign-in could not be started. Please try again.',
      );
    }
    // On success the browser navigates away, so there is no state to settle.
  }, [supabase, target]);

  const withPasskey = useCallback(async () => {
    if (!supabase) {
      setError('Sign-in is not configured on this deployment.');
      return;
    }
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      setError('This browser does not support passkeys. Use Google instead.');
      return;
    }
    setBusy('passkey');
    setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithPasskey();
      if (err) throw err;
      // A full navigation rather than a router push: the session cookie was
      // just written, and every server component downstream has to be
      // re-rendered against it.
      window.location.assign(target);
    } catch (err) {
      setBusy(null);
      setError(describePasskeyFailure(err));
      if (isRelyingPartyMismatch(err)) setPasskeyUnavailable(true);
    }
  }, [supabase, target]);

  return (
    <GlassCard className="auth-card" radius={28} rimWidth={10} blur={18} tint="var(--glass-tint)" interactive={false}>
      <div className="auth-head">
        <span className="auth-mark" aria-hidden="true">
          <LogoMark size={58} title={null} />
        </span>
        <h1>Sign in to TrustLens AI</h1>
        <p className="auth-lede">
          Signing in saves your reports to your account so they open on any device.
          Nothing is locked behind it.
        </p>
      </div>

      {error && (
        <p className="auth-error" role="alert">
          <Alert />
          <span>{error}</span>
        </p>
      )}

      <div className="auth-actions">
        <button
          type="button"
          className="auth-btn auth-btn-google"
          onClick={() => void withGoogle()}
          disabled={busy !== null}
        >
          <GoogleGlyph />
          <span>{busy === 'google' ? 'Opening Google…' : 'Continue with Google'}</span>
          {busy === 'google' ? <Spinner /> : <Arrow />}
        </button>

        <button
          type="button"
          className="auth-btn auth-btn-passkey"
          onClick={() => void withPasskey()}
          disabled={busy !== null || passkeyUnavailable}
        >
          <Lock />
          <span>
            {passkeyUnavailable
              ? 'Passkeys unavailable on this address'
              : busy === 'passkey'
                ? 'Waiting for your device…'
                : 'Continue with a passkey'}
          </span>
          {busy === 'passkey' ? <Spinner /> : <Arrow />}
        </button>
      </div>

      <details className="auth-explain">
        <summary>
          <Fingerprint />
          What is a passkey?
        </summary>
        <p>
          A passkey signs you in with Face ID, Touch ID or your screen lock, and never
          creates a password. It is bound to this site, so it cannot be handed to a
          lookalike page even if someone talks you into trying.
        </p>
        <p>
          No passkey on this device yet? Sign in with Google once and add one from your
          account. In the passkey sheet, &ldquo;Use a phone or tablet&rdquo; shows a QR
          code you can approve on your phone instead.
        </p>
      </details>

      <Link href={target} className="auth-skip">
        Continue without an account <Arrow />
      </Link>

      <p className="auth-note">
        <Check />
        <span>
          No password is created or stored. Both methods resist the credential phishing
          this product exists to detect.
        </span>
      </p>
    </GlassCard>
  );
}

/**
 * Turns a WebAuthn or Supabase failure into something a worried person can act on.
 *
 * `name` is read before `message` because these are DOMExceptions, whose names
 * are specified and stable while their messages are browser prose that changes
 * between releases.
 *
 * The SecurityError branch exists because of a real misconfiguration found
 * while testing: Supabase issues the passkey challenge with a relying-party id
 * fixed in its dashboard, and the browser refuses the credential unless that id
 * equals the domain serving the page or is a registrable suffix of it. Serving
 * the app from a domain the RP id does not cover makes every passkey sign-in
 * fail — and the generic "could not complete" message would send people to
 * Google forever while the real cause sits one dashboard field away. So it is
 * named, and the console carries the detail an owner needs.
 */
/**
 * Whether the browser refused because the relying-party id does not cover
 * this origin — a configuration fact rather than a transient failure.
 */
function isRelyingPartyMismatch(err: unknown): boolean {
  const name = err instanceof Error ? err.name : '';
  const message = err instanceof Error ? err.message : '';
  return name === 'SecurityError' || /relying party id|registrable domain/i.test(message);
}

function describePasskeyFailure(err: unknown): string {
  const name = err instanceof Error ? err.name : '';
  const message = err instanceof Error ? err.message : '';

  if (isRelyingPartyMismatch(err)) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        '[TrustLens] Passkey relying-party id does not cover this origin. ' +
          'Set the passkey RP id in the Supabase dashboard to the domain serving the app. ' +
          'Browser said:',
        message,
      );
    }
    return 'Passkeys are not set up for this web address yet. Use Google for now — this is a configuration issue, not a problem with your device.';
  }

  if (name === 'NotAllowedError' || /abort|cancel|timed out/i.test(message)) {
    return 'Passkey sign-in was cancelled.';
  }

  if (name === 'InvalidStateError' || /no credential|not found|no passkey/i.test(message)) {
    return 'No passkey exists for this site on this device yet. Sign in with Google once, then add one from your account.';
  }

  if (name === 'NotSupportedError' || /not enabled|unsupported|disabled/i.test(message)) {
    return 'Passkeys are not enabled for this project yet. Use Google instead.';
  }

  return 'Passkey sign-in did not complete. You can use Google instead.';
}

/** Google's mark, inline so the page needs no third-party request. */
function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6Z" />
      <path fill="#34A853" d="M12 23.5c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3C3.7 20.9 7.6 23.5 12 23.5Z" />
      <path fill="#FBBC05" d="M5.6 14.2a6.9 6.9 0 0 1 0-4.4v-3H1.8a11.5 11.5 0 0 0 0 10.4l3.8-3Z" />
      <path fill="#EA4335" d="M12 5.1c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.6 15.1.5 12 .5 7.6.5 3.7 3.1 1.8 6.8l3.8 3C6.5 7.1 9 5.1 12 5.1Z" />
    </svg>
  );
}

/** Waiting state. Pure CSS rotation, so it costs nothing while it spins. */
function Spinner() {
  return <span className="auth-spinner" aria-hidden="true" />;
}
