'use client';

import { useCallback, useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import { AlertIcon, CheckIcon, KeyIcon } from '../icons';

/**
 * Registers a passkey for the signed-in account.
 *
 * Shown only on the account page, because a passkey can only be added to an
 * account that already exists — registering one requires an authenticated
 * session to attach it to.
 */
export function AddPasskeyButton() {
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const supabase = getBrowserSupabase();

  const add = useCallback(async () => {
    if (!supabase) return;
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      setError('This browser does not support passkeys.');
      return;
    }
    setState('busy');
    setError(null);
    try {
      const { error: err } = await supabase.auth.registerPasskey();
      if (err) throw err;
      setState('done');
    } catch (err) {
      setState('idle');
      const message = err instanceof Error ? err.message : '';
      if (/NotAllowedError|abort|cancel/i.test(message)) {
        setError('Passkey setup was cancelled.');
      } else if (/InvalidStateError|already/i.test(message)) {
        setError('This device already has a passkey for TrustLens AI.');
      } else if (/not enabled|unsupported|disabled/i.test(message)) {
        setError('Passkeys are not enabled for this Supabase project yet.');
      } else {
        setError('The passkey could not be registered. Please try again.');
      }
    }
  }, [supabase]);

  if (state === 'done') {
    return (
      <p className="banner" role="status">
        <CheckIcon />
        <span>Passkey added. You can now sign in on this device without Google.</span>
      </p>
    );
  }

  return (
    <div>
      <button type="button" className="btn btn-secondary" onClick={() => void add()} disabled={state === 'busy'}>
        <KeyIcon />
        {state === 'busy' ? 'Follow your device prompt…' : 'Add a passkey to this device'}
      </button>
      {error && (
        <p className="banner banner-error" style={{ marginTop: 10 }} role="alert">
          <AlertIcon />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
