'use client';

import { useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import { Lock, Check, Alert } from '@/components/ui/icons';

/** Passkeys can only be enrolled after the user has authenticated. */
export function PasskeyManager() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  async function addPasskey() {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setStatus({ kind: 'error', text: 'Authentication is not configured on this deployment.' });
      return;
    }
    if (!window.isSecureContext || !window.PublicKeyCredential) {
      setStatus({ kind: 'error', text: 'Passkeys need a supported browser on HTTPS. Try the latest Chrome, Safari or Edge.' });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const { data, error } = await supabase.auth.registerPasskey();
      if (error) throw error;
      setStatus({
        kind: 'success',
        text: `Passkey added${data?.friendly_name ? ` for ${data.friendly_name}` : ''}. You can now use it on the sign-in screen.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (/passkey_disabled/i.test(message)) {
        setStatus({ kind: 'error', text: 'Passkeys are not enabled in Supabase yet. Enable Authentication → Passkeys and configure the TrustLens domain.' });
      } else if (/NotAllowedError|cancel|abort/i.test(message)) {
        setStatus({ kind: 'error', text: 'Passkey setup was cancelled. You can try again whenever you are ready.' });
      } else {
        setStatus({ kind: 'error', text: 'Could not add a passkey. Check that Supabase Passkeys is enabled and the website domain is configured correctly.' });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="muted-xs" style={{ margin: '8px 0 12px' }}>
        Add Face ID, Touch ID, Windows Hello or a device passkey after signing in with Google.
      </p>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => void addPasskey()} disabled={busy}>
        <Lock /> {busy ? 'Waiting for your device…' : 'Add a passkey'}
      </button>
      {status && (
        <p className={status.kind === 'success' ? 'notice notice-low' : 'notice notice-high'} role="status" style={{ marginTop: 12 }}>
          {status.kind === 'success' ? <Check /> : <Alert />} <span>{status.text}</span>
        </p>
      )}
    </div>
  );
}
