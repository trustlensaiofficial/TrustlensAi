/**
 * Checks that sign-in can actually succeed on a given origin.
 *
 * Written because both auth methods can be fully correct in the code and
 * still fail in production for reasons that live in the Supabase dashboard,
 * and neither failure is visible until a real person tries:
 *
 *   * The passkey relying-party id is a fixed dashboard value. The browser
 *     refuses a credential unless that id equals the domain serving the page
 *     or is a registrable suffix of it. Ship on a domain the id does not
 *     cover and every passkey sign-in fails with a SecurityError — which
 *     reads to the user as "my phone is broken".
 *
 *   * The OAuth callback origin has to be on Supabase's redirect allow-list.
 *     Miss it and Google completes, then the callback bounces with an error.
 *
 * Reads .env.local for credentials and prints nothing secret.
 *
 *   node scripts/verify-auth.mjs                      # checks localhost:3210
 *   node scripts/verify-auth.mjs https://trustlens.in # checks production
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

async function loadEnv() {
  const out = {};
  for (const file of ['.env.local', '.env']) {
    try {
      const text = await readFile(path.join(ROOT, file), 'utf8');
      for (const line of text.split('\n')) {
        const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
        if (m) out[m[1]] ??= m[2].trim().replace(/^["']|["']$/g, '');
      }
    } catch {
      /* optional */
    }
  }
  return { ...out, ...process.env };
}

const env = await loadEnv();
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const origin = (process.argv[2] ?? 'http://localhost:3210').replace(/\/+$/, '');
const host = new URL(origin).hostname;

if (!URL_ || !KEY) {
  console.error('FAIL  NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set.');
  process.exit(1);
}

let failures = 0;
const say = (verdict, label, detail = '') => {
  if (verdict === 'FAIL') failures += 1;
  console.log(`${verdict.padEnd(5)} ${label}${detail ? `\n      ${detail}` : ''}`);
};

console.log(`\nChecking sign-in for ${origin}\n${'-'.repeat(52)}`);

/* ------------------------------------------------------------- providers */

const settings = await fetch(`${URL_}/auth/v1/settings`, { headers: { apikey: KEY } })
  .then((r) => (r.ok ? r.json() : null))
  .catch(() => null);

if (!settings) {
  say('FAIL', 'Supabase auth is reachable');
  process.exit(1);
}
say('PASS', 'Supabase auth is reachable');

say(settings.external?.google ? 'PASS' : 'FAIL', 'Google provider is enabled');
say(settings.passkeys_enabled ? 'PASS' : 'FAIL', 'Passkeys are enabled');

/* ------------------------------------------------- the relying-party id */

if (settings.passkeys_enabled) {
  const res = await fetch(`${URL_}/auth/v1/passkeys/authentication/options`, {
    method: 'POST',
    headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: '{}',
  }).catch(() => null);

  const body = res && res.ok ? await res.json().catch(() => null) : null;
  const rpId = body?.options?.rpId ?? body?.options?.publicKey?.rpId ?? null;

  if (!rpId) {
    say('FAIL', 'Passkey challenge returns a relying-party id', `HTTP ${res?.status ?? 'no response'}`);
  } else {
    /*
     * WebAuthn's rule: the id must equal the host, or the host must end with
     * "." + id. "example.com" covers "app.example.com"; it does not cover
     * "example.in", and a sibling Vercel domain covers neither.
     */
    const covered = host === rpId || host.endsWith(`.${rpId}`);
    say(
      covered ? 'PASS' : 'FAIL',
      `Passkey relying-party id covers ${host}`,
      covered
        ? `rpId = ${rpId}`
        : `rpId = ${rpId}, but the app is served from ${host}.\n      ` +
          `Every passkey sign-in on this origin will fail with a SecurityError.\n      ` +
          `Fix: Supabase dashboard > Authentication > Passkeys > set the relying-party id to ${host}.`,
    );
  }
}

/* ---------------------------------------------------- the OAuth callback */

const authorize = new URL(`${URL_}/auth/v1/authorize`);
authorize.searchParams.set('provider', 'google');
authorize.searchParams.set('redirect_to', `${origin}/auth/callback`);

const redirect = await fetch(authorize, { redirect: 'manual', headers: { apikey: KEY } }).catch(() => null);
const location = redirect?.headers.get('location') ?? '';

if (!location) {
  say('FAIL', 'Google authorize returns a redirect', `HTTP ${redirect?.status ?? 'no response'}`);
} else if (location.includes('accounts.google.com')) {
  say('PASS', 'Google authorize reaches accounts.google.com');
  const sent = new URL(location).searchParams.get('redirect_uri');
  say(
    sent === `${URL_}/auth/v1/callback` ? 'PASS' : 'FAIL',
    'Google callback points back at Supabase',
    `redirect_uri = ${sent}`,
  );
} else if (/error/i.test(location)) {
  // Supabase bounces the request straight back when the origin is not on the
  // allow-list, which is the single most common cause of a broken sign-in.
  say('FAIL', `${origin}/auth/callback is on the Supabase redirect allow-list`,
    `Supabase redirected to: ${location.slice(0, 160)}\n      ` +
    `Fix: Supabase dashboard > Authentication > URL Configuration > add ${origin}/auth/callback.`);
} else {
  say('FAIL', 'Google authorize reaches accounts.google.com', `went to ${location.slice(0, 120)}`);
}

console.log(`${'-'.repeat(52)}\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}\n`);
process.exit(failures === 0 ? 0 : 1);
