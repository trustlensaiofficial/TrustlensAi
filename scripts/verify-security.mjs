/**
 * Behavioural security verification against a real Supabase project.
 *
 * Why this exists rather than a set of pg_catalog queries: a service-role
 * query proves nothing about row-level security, because the service role
 * bypasses RLS entirely. The only honest test of an access control is to
 * attempt the access you expect to be refused, as the role you expect to be
 * refused it. So this script acts as an anonymous caller and as a second
 * signed-in user, and checks it gets nothing.
 *
 * It also tests the append-only triggers, which cannot be verified by asking
 * whether the function exists — PostgREST will not even show a trigger
 * function, and a trigger that exists but is attached to the wrong table is
 * indistinguishable from one that works until you try to update a row.
 *
 * SAFETY
 *   - Guarded behind TRUSTLENS_ALLOW_DB_TESTS=1 so it cannot run by accident.
 *   - Creates its own clearly-labelled test users and deletes them at the end,
 *     which cascades away every row it created.
 *   - Touches no pre-existing row. Every id it writes is one it just made.
 *   - Prints no key, no token and no email-local secret.
 *
 * Usage:
 *   TRUSTLENS_ALLOW_DB_TESTS=1 node scripts/verify-security.mjs
 */

import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

if (process.env.TRUSTLENS_ALLOW_DB_TESTS !== '1') {
  console.error(
    'Refusing to run. This script writes to a real database.\n' +
      'Set TRUSTLENS_ALLOW_DB_TESTS=1 if that is what you intend.',
  );
  process.exit(2);
}

/* Load .env.local the way Next does, without echoing any value. */
function loadEnv(file = '.env.local') {
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* env may come from the shell instead */
  }
}
loadEnv();

const URL_ = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!URL_ || !SERVICE || !ANON) {
  console.error('Missing SUPABASE url / service key / publishable key in the environment.');
  process.exit(2);
}

const { createClient } = await import('@supabase/supabase-js');

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
const anon = createClient(URL_, ANON, { auth: { persistSession: false, autoRefreshToken: false } });

/* ----------------------------------------------------------------- results */

let pass = 0;
let fail = 0;
const failures = [];

function check(name, ok, detail = '') {
  if (ok) {
    pass += 1;
    console.log(`  PASS  ${name}`);
  } else {
    fail += 1;
    failures.push(name);
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
  console.log('-'.repeat(title.length));
}

/** A row count that treats an error as "refused", which is what we want here. */
async function readable(client, table) {
  const { data, error } = await client.from(table).select('*').limit(1);
  if (error) return { allowed: false, reason: error.code ?? error.message?.slice(0, 60) };
  return { allowed: true, rows: data?.length ?? 0 };
}

/* ------------------------------------------------------------ test accounts */

const stamp = Date.now();
const users = [];

async function makeUser(label) {
  const email = `trustlens-sectest-${label}-${stamp}@example.invalid`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: randomUUID(), // never printed, never reused, deleted at the end
    email_confirm: true,
    user_metadata: { purpose: 'automated security verification', created_by: 'scripts/verify-security.mjs' },
  });
  if (error) throw new Error(`could not create test user ${label}: ${error.message}`);
  users.push(data.user.id);
  return data.user.id;
}

/** A client authenticated as a given user, via an admin-minted session. */
async function clientFor(userId) {
  const { data: u } = await admin.auth.admin.getUserById(userId);
  const email = u?.user?.email;
  if (!email) throw new Error('test user has no email');
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (error) throw new Error(`could not mint a session: ${error.message}`);

  const c = createClient(URL_, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: vErr } = await c.auth.verifyOtp({
    type: 'magiclink',
    token_hash: data.properties.hashed_token,
  });
  if (vErr) throw new Error(`could not establish a session: ${vErr.message}`);
  return c;
}

async function cleanup() {
  for (const id of users) {
    // Cascades remove every case, artifact, event and consent row we created.
    await admin.auth.admin.deleteUser(id).catch(() => {});
  }
}

/* -------------------------------------------------------------------- tests */

try {
  const ref = /https:\/\/([a-z0-9]+)\.supabase\.co/.exec(URL_)?.[1] ?? 'unknown';
  console.log(`Project ref: ${ref}`);

  /* 1. Anonymous access. The publishable key is in every browser bundle, so
   *    this is the baseline an attacker starts from. */
  section('1. Anonymous caller (publishable key) must read nothing');
  for (const t of ['scans', 'cases', 'case_artifacts', 'case_events', 'consent_receipts', 'rate_limits']) {
    const r = await readable(anon, t);
    check(
      `anon cannot read ${t}`,
      !r.allowed || r.rows === 0,
      r.allowed ? `returned ${r.rows} row(s)` : '',
    );
  }

  const rpc = await anon.rpc('consume_rate_limit', { p_key: 'anon-probe', p_limit: 5, p_window_seconds: 60 });
  check('anon cannot execute consume_rate_limit', Boolean(rpc.error), rpc.error ? '' : 'the call succeeded');

  /* 2. Owner isolation between two real signed-in users. */
  section('2. One signed-in user must not reach another user’s case');
  const alice = await makeUser('a');
  const bob = await makeUser('b');
  const aliceClient = await clientFor(alice);
  const bobClient = await clientFor(bob);

  const { data: aCase, error: aErr } = await admin
    .from('cases')
    .insert({ user_id: alice, title: 'security verification case', context: 'generic', status: 'draft' })
    .select('id')
    .single();
  if (aErr) throw new Error(`could not create a case: ${aErr.message}`);
  const caseId = aCase.id;

  const aRead = await aliceClient.from('cases').select('id').eq('id', caseId);
  check('owner can read their own case', !aRead.error && aRead.data?.length === 1,
    aRead.error ? aRead.error.message.slice(0, 60) : `got ${aRead.data?.length} row(s)`);

  const bRead = await bobClient.from('cases').select('id').eq('id', caseId);
  check('a different user reads nothing', !bRead.error && (bRead.data?.length ?? 0) === 0,
    bRead.error ? `errored: ${bRead.error.code}` : `got ${bRead.data?.length} row(s)`);

  const bUpdate = await bobClient.from('cases').update({ title: 'hijacked' }).eq('id', caseId).select('id');
  check('a different user cannot update it', Boolean(bUpdate.error) || (bUpdate.data?.length ?? 0) === 0,
    bUpdate.error ? '' : `updated ${bUpdate.data?.length} row(s)`);

  const bDelete = await bobClient.from('cases').delete().eq('id', caseId).select('id');
  check('a different user cannot delete it', Boolean(bDelete.error) || (bDelete.data?.length ?? 0) === 0,
    bDelete.error ? '' : `deleted ${bDelete.data?.length} row(s)`);

  /* 3. Forged ownership. A client inventing a user_id must be refused by the
   *    policy's WITH CHECK, not merely by our server code remembering to. */
  section('3. Forged ownership must be refused by the database');
  const forged = await bobClient
    .from('cases')
    .insert({ user_id: alice, title: 'forged owner', context: 'generic' })
    .select('id');
  check('cannot insert a case owned by someone else', Boolean(forged.error) || (forged.data?.length ?? 0) === 0,
    forged.error ? '' : 'the insert succeeded');
  if (!forged.error && forged.data?.[0]?.id) {
    await admin.from('cases').delete().eq('id', forged.data[0].id);
  }

  /* 4. Append-only. This is the part that cannot be checked by introspection:
   *    a trigger attached to the wrong table looks identical to a working one
   *    until an update is attempted. */
  section('4. Append-only tables must refuse UPDATE, for every role');
  const { data: ev, error: evErr } = await admin
    .from('case_events')
    .insert({ case_id: caseId, kind: 'note_added', detail: 'security verification' })
    .select('id')
    .single();
  check('an event can be appended', !evErr && Boolean(ev?.id), evErr ? evErr.message.slice(0, 80) : '');

  if (ev?.id) {
    // Attempted as the SERVICE ROLE on purpose: RLS cannot stop this one, so
    // if the trigger is missing the update will succeed and the claim in
    // docs/DATABASE_DICTIONARY.md is false.
    const upd = await admin.from('case_events').update({ detail: 'rewritten' }).eq('id', ev.id).select('id');
    check(
      'case_events refuses UPDATE even for the service role',
      Boolean(upd.error),
      upd.error ? `refused with ${upd.error.code}` : 'THE UPDATE SUCCEEDED — the trigger is not attached',
    );
    if (upd.error) console.log(`        (refusal: ${String(upd.error.message).slice(0, 90)})`);
  }

  const { data: cr, error: crErr } = await admin
    .from('consent_receipts')
    .insert({ user_id: alice, capability: 'cloud_ai', granted: true, policy_version: 'sectest-1' })
    .select('id')
    .single();
  check('a consent receipt can be appended', !crErr && Boolean(cr?.id), crErr ? crErr.message.slice(0, 80) : '');

  if (cr?.id) {
    const upd = await admin.from('consent_receipts').update({ granted: false }).eq('id', cr.id).select('id');
    check(
      'consent_receipts refuses UPDATE even for the service role',
      Boolean(upd.error),
      upd.error ? `refused with ${upd.error.code}` : 'THE UPDATE SUCCEEDED — the trigger is not attached',
    );
  }

  /* 5. Artifacts must not be editable, and must be reachable only through an
   *    owned case. */
  section('5. Artifacts follow their case');
  const { data: art } = await admin
    .from('case_artifacts')
    .insert({ case_id: caseId, type: 'note', text: 'security verification', provenance: 'user_supplied', freshness: 'unknown' })
    .select('id')
    .single();

  const aArt = await aliceClient.from('case_artifacts').select('id').eq('case_id', caseId);
  check('owner can read artifacts of their case', !aArt.error && (aArt.data?.length ?? 0) === 1,
    aArt.error ? aArt.error.message.slice(0, 60) : `got ${aArt.data?.length}`);

  const bArt = await bobClient.from('case_artifacts').select('id').eq('case_id', caseId);
  check('a different user reads no artifacts', !bArt.error && (bArt.data?.length ?? 0) === 0,
    bArt.error ? `errored: ${bArt.error.code}` : `got ${bArt.data?.length} row(s)`);

  if (art?.id) {
    const upd = await aliceClient.from('case_artifacts').update({ text: 'edited' }).eq('id', art.id).select('id');
    check('the owner cannot silently edit evidence', Boolean(upd.error) || (upd.data?.length ?? 0) === 0,
      upd.error ? '' : `updated ${upd.data?.length} row(s)`);
  }

  /* 6. Deletion cascades, which is what makes the retention promise real. */
  section('6. Deleting the account removes the chain');
  await admin.auth.admin.deleteUser(alice);
  users.splice(users.indexOf(alice), 1);

  const leftCases = await admin.from('cases').select('id').eq('id', caseId);
  check('the case is gone', (leftCases.data?.length ?? 0) === 0, `found ${leftCases.data?.length} row(s)`);

  const leftEvents = await admin.from('case_events').select('id').eq('case_id', caseId);
  check('its events are gone', (leftEvents.data?.length ?? 0) === 0, `found ${leftEvents.data?.length} row(s)`);

  const leftArtifacts = await admin.from('case_artifacts').select('id').eq('case_id', caseId);
  check('its artifacts are gone', (leftArtifacts.data?.length ?? 0) === 0, `found ${leftArtifacts.data?.length} row(s)`);

  const leftConsent = await admin.from('consent_receipts').select('id').eq('user_id', alice);
  check('its consent receipts are gone', (leftConsent.data?.length ?? 0) === 0, `found ${leftConsent.data?.length} row(s)`);
} catch (err) {
  fail += 1;
  failures.push(`harness error: ${err instanceof Error ? err.message : String(err)}`);
  console.log(`\n  ERROR  ${err instanceof Error ? err.message : String(err)}`);
} finally {
  await cleanup();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${pass} passed, ${fail} failed`);
  if (failures.length) {
    console.log('\nFailed:');
    for (const f of failures) console.log(`  - ${f}`);
  }
  console.log('Test users deleted.');
  process.exit(fail === 0 ? 0 : 1);
}
