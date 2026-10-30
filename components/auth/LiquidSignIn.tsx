'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import { safeNextPath, siteOrigin } from '@/lib/auth/config';
import { LiquidButton } from '@/components/liquid/LiquidButton';
import { AlertIcon, GoogleIcon, KeyIcon } from '../icons';

type Busy = null | 'google' | 'passkey';

/**
 * Sign-in: Google and passkeys only.
 *
 * There is deliberately no email/password option. A product about credential
 * theft should not mint another password for people to reuse, and both
 * supported methods are phishing-resistant in a way a password is not.
 *
 * Signing in is also never required to continue — it only decides whether
 * reports follow you between devices — so this screen always offers a way
 * forward rather than becoming a gate.
 */
export function LiquidSignIn({ next, initialError }: { next: string; initialError?: string }) {
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);

  const supabase = getBrowserSupabase();
  const target = safeNextPath(next, '/story');

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
          ? 'Google sign-in is not enabled for this project yet.'
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
    // Called straight from the click so the user gesture survives: the
    // platform then raises its own sheet immediately. Default mediation is
    // what makes that sheet the full one, including "use a phone or tablet"
    // — scan the QR with a phone and the phone's Face ID completes it.
    setBusy('passkey');
    setError(null);
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
        setError(
          'No passkey found. On this device, sign in with Google once and add a passkey from your account page. To use a passkey already on your phone, choose “Use a phone or tablet” in the sheet and scan the QR code.',
        );
      } else if (/not enabled|unsupported|disabled/i.test(message)) {
        setError('Passkeys are not enabled for this project yet.');
      } else {
        setError('Passkey sign-in did not complete. You can use Google sign-in instead.');
      }
    }
  }, [supabase, target]);

  /*
   * Conditional UI: if this device already holds a passkey for the site, the
   * platform offers it the moment the page opens — Face ID or Touch ID with
   * nothing to click.
   *
   * Deliberately NOT used for the button below. Conditional mediation only
   * ever offers credentials already on this device, so it silently skips the
   * platform's full picker — which is where "use a phone or tablet", and
   * therefore the QR code, lives. The button uses default mediation so that
   * cross-device sign-in is reachable.
   *
   * Entirely best-effort; any failure leaves the buttons untouched.
   */
  useEffect(() => {
    let cancelled = false;
    const tryAutofill = async () => {
      if (!supabase || typeof window === 'undefined') return;
      const available = await window.PublicKeyCredential
        ?.isConditionalMediationAvailable?.()
        .catch(() => false);
      if (!available || cancelled) return;
      try {
        const { error: err } = await supabase.auth.signInWithPasskey({ mediation: 'conditional' });
        if (!err && !cancelled) window.location.assign(target);
      } catch {
        /* No passkey offered, or the user dismissed it. The buttons still work. */
      }
    };
    void tryAutofill();
    return () => { cancelled = true; };
  }, [supabase, target]);

  return (
    <div className="lq-glass auth-card">
      <Image src="/logo-mark.png" alt="" width={141} height={118} className="auth-card-mark" />
      <h1 className="lq-h2">Sign in to TrustLens AI</h1>
      <p className="lq-lede auth-card-lede">
        Signing in saves your reports to your account so you can reopen them on any device.
        Nothing is locked behind it — you can go straight on without an account.
      </p>

      {error && (
        <div className="auth-alert" role="alert">
          <AlertIcon />
          <p>{error}</p>
        </div>
      )}

      <div className="auth-card-actions">
        <LiquidButton onClick={() => void withGoogle()} disabled={busy !== null}>
          <GoogleIcon />
          {busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
        </LiquidButton>

        <LiquidButton variant="ghost" onClick={() => void withPasskey()} disabled={busy !== null}>
          <KeyIcon />
          {busy === 'passkey' ? 'Waiting for Face ID…' : 'Continue with a passkey'}
        </LiquidButton>

        <p className="auth-hint">
          Works with Face ID or Touch ID on this device — or choose
          <strong> “Use a phone or tablet” </strong>
          to scan a QR code and approve it on your phone.
        </p>
      </div>

      <Link href={target} className="auth-skip">
        Continue without an account →
      </Link>

      <p className="auth-card-note">
        No password is ever created or stored. Both methods resist exactly the kind of
        credential phishing this product exists to detect.
      </p>
    </div>
  );
}
