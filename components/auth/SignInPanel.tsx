'use client';

import { useCallback, useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import { safeNextPath, siteOrigin } from '@/lib/auth/config';
import { AlertIcon, CheckIcon, GoogleIcon, KeyIcon, ShieldIcon } from '../icons';

type Busy = null | 'google' | 'passkey' | 'register';

/**
 * Sign-in: Google and passkeys only.
 *
 * There is deliberately no email/password option. A product about credential
 * theft should not be creating another password for people to reuse, and both
 * supported methods are phishing-resistant in a way a password is not.
 */
export function SignInPanel({ next }: { next: string }) {
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const supabase = getBrowserSupabase();
  const target = safeNextPath(next);

  const withGoogle = useCallback(async () => {
    if (!supabase) {
      setError('Sign-in is not configured on this deployment.');
      return;
    }
    setBusy('google');
    setError(null);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Built from configuration, never from a header or user input.
        redirectTo: `${siteOrigin()}/auth/callback?next=${encodeURIComponent(target)}`,
      },
    });
    if (err) {
      setBusy(null);
      setError(
        /provider/i.test(err.message)
          ? 'Google sign-in is not enabled for this project yet. Enable the Google provider in Supabase → Authentication → Providers.'
          : 'Google sign-in could not be started. Please try again.',
      );
    }
    // On success the browser navigates away; no state update needed.
  }, [supabase, target]);

  const withPasskey = useCallback(async () => {
    if (!supabase) {
      setError('Sign-in is not configured on this deployment.');
      return;
    }
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      setError('This browser does not support passkeys. Use Google sign-in instead.');
      return;
    }
    setBusy('passkey');
    setError(null);
    setNotice(null);
    try {
      const { error: err } = await supabase.auth.signInWithPasskey();
      if (err) throw err;
      window.location.assign(target);
    } catch (err) {
      setBusy(null);
      const message = err instanceof Error ? err.message : '';
      if (/NotAllowedError|abort|cancel/i.test(message)) {
        setError('Passkey sign-in was cancelled.');
      } else if (/no credential|not found|no passkey/i.test(message)) {
        setError('No passkey was found for this site on this device. Sign in with Google once, then add a passkey.');
      } else if (/not enabled|unsupported|disabled/i.test(message)) {
        setError('Passkeys are not enabled for this Supabase project yet. Enable them in Authentication → Sign In / Providers.');
      } else {
        setError('Passkey sign-in did not complete. You can use Google sign-in instead.');
      }
    }
  }, [supabase, target]);

  return (
    <div className="auth-panel">
      <div className="auth-head">
        <span className="auth-mark" aria-hidden="true"><ShieldIcon /></span>
        <h1>Sign in to TrustLens AI</h1>
        <p>
          Saves your reports to your account so you can reopen them on any device. You can keep
          using the analyser without an account — nothing is locked behind this.
        </p>
      </div>

      {error && (
        <div className="banner banner-error" role="alert">
          <AlertIcon />
          <p>{error}</p>
        </div>
      )}
      {notice && (
        <div className="banner" role="status">
          <CheckIcon />
          <p>{notice}</p>
        </div>
      )}

      <div className="auth-actions">
        <button
          type="button"
          className="btn btn-primary btn-premium auth-btn"
          onClick={() => void withGoogle()}
          disabled={busy !== null}
        >
          <GoogleIcon />
          {busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
        </button>

        <button
          type="button"
          className="btn btn-secondary auth-btn"
          onClick={() => void withPasskey()}
          disabled={busy !== null}
        >
          <KeyIcon />
          {busy === 'passkey' ? 'Waiting for your passkey…' : 'Sign in with a passkey'}
        </button>
      </div>

      <p className="auth-note">
        No password is ever created or stored. Both methods are resistant to the kind of
        credential phishing this product exists to detect.
      </p>
    </div>
  );
}
