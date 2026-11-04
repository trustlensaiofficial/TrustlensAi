'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import { safeNextPath, siteOrigin } from '@/lib/auth/config';
import { Alert, Arrow, Check, Lock, Shield } from '@/components/ui/icons';

type Busy = null | 'google' | 'passkey';

/**
 * Sign-in: Google and passkeys only.
 *
 * No email and password, deliberately. A product about credential theft
 * should not create another password for someone to reuse, and both methods
 * here resist exactly the phishing TrustLens exists to catch.
 *
 * Signing in is never required. It only decides whether reports follow you
 * between devices, so this screen always offers a way onward rather than
 * standing as a gate in front of the product.
 */
export function SignIn({ next, initialError }: { next: string; initialError?: string }) {
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);

  const supabase = getBrowserSupabase();
  const target = safeNextPath(next, '/check');

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
      window.location.assign(target);
    } catch (err) {
      setBusy(null);
      const message = err instanceof Error ? err.message : '';
      if (/NotAllowedError|abort|cancel/i.test(message)) setError('Passkey sign-in was cancelled.');
      else if (/no credential|not found|no passkey/i.test(message)) {
        setError('No passkey exists for this site on this device yet. Sign in with Google once, then add one from your account.');
      } else if (/not enabled|unsupported|disabled/i.test(message)) {
        setError('Passkeys are not enabled for this project yet.');
      } else setError('Passkey sign-in did not complete. You can use Google instead.');
    }
  }, [supabase, target]);

  return (
    <div className="card card-pad signin">
      <span className="signin-mark" aria-hidden="true"><Shield /></span>
      <h1>Sign in to TrustLens</h1>
      <p className="lede signin-lede">
        Signing in saves your reports to your account so they open on any device. Nothing is
        locked behind it — you can carry on without an account.
      </p>

      {error && (
        <p className="notice notice-high" role="alert"><Alert /><span>{error}</span></p>
      )}

      <div className="signin-actions">
        <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => void withGoogle()} disabled={busy !== null}>
          <GoogleGlyph />
          {busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
        </button>
        <button type="button" className="btn btn-secondary btn-lg btn-block" onClick={() => void withPasskey()} disabled={busy !== null}>
          <Lock />
          {busy === 'passkey' ? 'Waiting for Face ID…' : 'Continue with a passkey'}
        </button>
      </div>

      <p className="muted-xs signin-hint">
        A passkey uses Face ID, Touch ID or your screen lock. Choose &ldquo;Use a phone or
        tablet&rdquo; in the sheet to scan a QR code and approve it on your phone.
      </p>

      <Link href={target} className="btn btn-ghost signin-skip">
        Continue without an account <Arrow />
      </Link>

      <p className="signin-note">
        <Check />
        No password is ever created or stored. Both methods resist the kind of credential
        phishing this product exists to detect.
      </p>
    </div>
  );
}

/** Google's mark, inline so the page needs no third-party request. */
function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6Z" />
      <path fill="#34A853" d="M12 23.5c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3C3.7 20.9 7.6 23.5 12 23.5Z" />
      <path fill="#FBBC05" d="M5.6 14.2a6.9 6.9 0 0 1 0-4.4v-3H1.8a11.5 11.5 0 0 0 0 10.4l3.8-3Z" />
      <path fill="#EA4335" d="M12 5.1c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.6 15.1.5 12 .5 7.6.5 3.7 3.1 1.8 6.8l3.8 3C6.5 7.1 9 5.1 12 5.1Z" />
    </svg>
  );
}
