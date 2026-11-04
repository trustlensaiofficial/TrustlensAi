/**
 * Exercises the case API over real HTTP, with a real signed-in session.
 *
 * `scripts/verify-security.mjs` proves the database layer: RLS, triggers,
 * ownership, cascades. This proves the layer above it — that the routes
 * actually complete a round trip, that the bearer token is honoured, and that
 * one user's case is unreachable to another *through the API* and not merely
 * in the tables.
 *
 * That distinction matters. A route that forgets its `.eq('user_id', …)` would
 * pass every database test in the other script, because the service-role
 * client it holds bypasses RLS entirely. The only way to catch it is to ask
 * the API as the wrong user and check what comes back.
 *
 * SAFETY
 *   - Guarded behind TRUSTLENS_ALLOW_DB_TESTS=1.
 *   - Creates its own users at reserved `.invalid` addresses and deletes them,
 *     which cascades away every row it created.
 *   - Touches no pre-existing row.
 *   - Prints no token, key or secret.
 *
 * Usage, with a dev server already running:
 *   TRUSTLENS_ALLOW_DB_TESTS=1 node scripts/verify-case-api.mjs http://localhost:3000
 */

import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

if (process.env.TRUSTLENS_ALLOW_DB_TESTS !== '1') {
  console.error('Refusing to run: this writes to a real database. Set TRUSTLENS_ALLOW_DB_TESTS=1.');
  process.exit(2);
}

const BASE = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '');

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const URL_ = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const { createClient } = await import('@supabase/supabase-js');
const admin = createClient(URL_, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

let pass = 0;
let fail = 0;
const failures = [];

function check(name, ok, detail = '') {
  if (ok) { pass += 1; console.log(`  PASS  ${name}`); }
  else { fail += 1; failures.push(name); console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
}
function section(t) { console.log(`\n${t}\n${'-'.repeat(t.length)}`); }

const users = [];
async function makeUser(label) {
  const email = `trustlens-apitest-${label}-${Date.now()}@example.invalid`;
  const { data, error } = await admin.auth.admin.createUser({
    email, password: randomUUID(), email_confirm: true,
    user_metadata: { purpose: 'automated case-API verification' },
  });
  if (error) throw new Error(`createUser ${label}: ${error.message}`);
  users.push(data.user.id);
  return { id: data.user.id, email };
}

/** An access token for a user, minted through the admin link flow. */
async function tokenFor(email) {
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (error) throw new Error(`generateLink: ${error.message}`);
  const c = createClient(URL_, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: session, error: vErr } = await c.auth.verifyOtp({
    type: 'magiclink', token_hash: data.properties.hashed_token,
  });
  if (vErr) throw new Error(`verifyOtp: ${vErr.message}`);
  const token = session.session?.access_token;
  if (!token) throw new Error('no access token in session');
  return token;
}

/** A fetch that carries the bearer token and parses JSON defensively. */
async function api(method, path, token, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  let json = null;
  const text = await res.text();
  if (text) { try { json = JSON.parse(text); } catch { /* not json */ } }
  return { status: res.status, json };
}

try {
  console.log(`Base URL: ${BASE}`);

  /* 0. The endpoints that must work with no account at all. */
  section('0. No account required for analysis or recovery');
  const anonAnalyse = await api('POST', '/api/v1/analyses', null, {
    text: 'Refund of Rs 2,499 is pending. Accept the request and enter your UPI PIN to receive it.',
    liveChecks: false,
  });
  check('POST /analyses works unauthenticated', anonAnalyse.status === 200, `got ${anonAnalyse.status}`);
  check('it reads the payment action',
    anonAnalyse.json?.report?.paymentAction?.claimContradiction === true,
    `contradiction=${anonAnalyse.json?.report?.paymentAction?.claimContradiction}`);

  const anonPlan = await api('POST', '/api/v1/recovery-plan', null, { actionState: 'transferred_money' });
  check('POST /recovery-plan works unauthenticated', anonPlan.status === 200, `got ${anonPlan.status}`);
  check('its first channel is 1930',
    anonPlan.json?.recoveryPlan?.officialChannels?.[0]?.contact === '1930');

  /* 1. Cases refuse an anonymous caller, and say the rest does not. */
  section('1. Cases need an account, and the 401 says only cases do');
  const noAuth = await api('GET', '/api/v1/cases', null);
  check('GET /cases is 401 without a token', noAuth.status === 401, `got ${noAuth.status}`);
  check('the 401 notes that analysis needs no account',
    /do not require an account/i.test(noAuth.json?.note ?? ''), noAuth.json?.note ?? '(no note)');

  /* 2. The full lifecycle, as the owner. */
  section('2. Case lifecycle over HTTP');
  const alice = await makeUser('a');
  const aliceToken = await tokenFor(alice.email);

  const created = await api('POST', '/api/v1/cases', aliceToken, {
    title: 'API verification case', context: 'bank_scam',
  });
  check('POST /cases returns 201', created.status === 201, `got ${created.status} ${JSON.stringify(created.json)?.slice(0, 120)}`);
  const caseId = created.json?.case?.id;
  check('it returns a case id', Boolean(caseId));
  check('status starts at draft', created.json?.case?.status === 'draft', created.json?.case?.status);

  const listed = await api('GET', '/api/v1/cases', aliceToken);
  check('GET /cases lists it', listed.status === 200 && listed.json?.cases?.some((c) => c.id === caseId));
  check('the list carries a cursor field', 'nextCursor' in (listed.json ?? {}));

  const artifact = await api('POST', `/api/v1/cases/${caseId}/artifacts`, aliceToken, {
    type: 'message',
    text: 'Transfer your balance to the safe account to protect your funds.',
    senderLabel: 'SBI Fraud Team',
  });
  check('POST artifacts returns 201', artifact.status === 201, `got ${artifact.status}`);
  check('the artifact is user_supplied', artifact.json?.artifact?.provenance === 'user_supplied');
  check('its freshness is unknown, not live', artifact.json?.artifact?.freshness === 'unknown');

  const event = await api('POST', `/api/v1/cases/${caseId}/events`, aliceToken, {
    actionState: 'transferred_money',
  });
  check('POST events returns 201 with only an actionState', event.status === 201, `got ${event.status}`);
  check('kind defaulted to action_reported', event.json?.result?.event?.kind === 'action_reported',
    event.json?.result?.event?.kind);
  check('the case advanced to user_acted', event.json?.result?.case?.status === 'user_acted',
    event.json?.result?.case?.status);
  check('furthestAction recorded', event.json?.result?.case?.furthestAction === 'transferred_money');

  // The rule that matters: a milder later answer must not soften the plan.
  const milder = await api('POST', `/api/v1/cases/${caseId}/events`, aliceToken, {
    actionState: 'opened_link',
  });
  check('a milder later report does not downgrade furthestAction',
    milder.json?.result?.case?.furthestAction === 'transferred_money',
    milder.json?.result?.case?.furthestAction);

  const plan = await api('GET', `/api/v1/cases/${caseId}/recovery-plan`, aliceToken);
  check('GET recovery-plan returns the plan', plan.status === 200 && Boolean(plan.json?.recoveryPlan));
  check('it is the transferred_money plan',
    plan.json?.recoveryPlan?.actionState === 'transferred_money');
  check('urgency is immediate', plan.json?.recoveryPlan?.urgency === 'immediate');
  check('the disclaimer is present', /cannot reverse a payment/i.test(plan.json?.recoveryPlan?.disclaimer ?? ''));

  const detail = await api('GET', `/api/v1/cases/${caseId}`, aliceToken);
  check('GET one case returns its artifacts', (detail.json?.case?.artifacts?.length ?? 0) >= 1);
  check('and its event timeline', (detail.json?.case?.events?.length ?? 0) >= 3);
  check('the timeline opens with case_opened',
    detail.json?.case?.events?.[0]?.kind === 'case_opened', detail.json?.case?.events?.[0]?.kind);

  const patched = await api('PATCH', `/api/v1/cases/${caseId}`, aliceToken, { status: 'reported' });
  check('PATCH sets a status the owner chose', patched.status === 200 && patched.json?.case?.status === 'reported',
    `${patched.status} ${patched.json?.case?.status}`);

  const badStatus = await api('PATCH', `/api/v1/cases/${caseId}`, aliceToken, { status: 'nonsense' });
  check('PATCH refuses an unrecognised status', badStatus.status === 400, `got ${badStatus.status}`);

  const badEvent = await api('POST', `/api/v1/cases/${caseId}/events`, aliceToken, { actionState: 'toString' });
  check('an inherited property is not a valid action state', badEvent.status === 400, `got ${badEvent.status}`);
  check('and the refusal lists the valid values',
    Array.isArray(badEvent.json?.validValues) && badEvent.json.validValues.length === 12,
    `${badEvent.json?.validValues?.length} values`);

  const emptyArtifact = await api('POST', `/api/v1/cases/${caseId}/artifacts`, aliceToken, { type: 'note' });
  check('an artifact with no content is refused', emptyArtifact.status === 400, `got ${emptyArtifact.status}`);

  /* 3. The real question: is another user's case reachable through the API? */
  section('3. Another user cannot reach it through the API');
  const bob = await makeUser('b');
  const bobToken = await tokenFor(bob.email);

  const bobGet = await api('GET', `/api/v1/cases/${caseId}`, bobToken);
  // 404, not 403: telling a stranger the id is real confirms the id.
  check('GET another user’s case is 404', bobGet.status === 404, `got ${bobGet.status}`);

  const bobList = await api('GET', '/api/v1/cases', bobToken);
  check('it does not appear in their list',
    bobList.status === 200 && !(bobList.json?.cases ?? []).some((c) => c.id === caseId));

  const bobPatch = await api('PATCH', `/api/v1/cases/${caseId}`, bobToken, { title: 'hijacked' });
  check('PATCH by another user is 404', bobPatch.status === 404, `got ${bobPatch.status}`);

  const bobArtifact = await api('POST', `/api/v1/cases/${caseId}/artifacts`, bobToken, { type: 'note', text: 'x' });
  check('they cannot attach an artifact', bobArtifact.status === 404, `got ${bobArtifact.status}`);

  const bobEvent = await api('POST', `/api/v1/cases/${caseId}/events`, bobToken, { actionState: 'opened_link' });
  check('they cannot append an event', bobEvent.status === 404, `got ${bobEvent.status}`);

  const bobPlan = await api('GET', `/api/v1/cases/${caseId}/recovery-plan`, bobToken);
  check('they cannot read its recovery plan', bobPlan.status === 404, `got ${bobPlan.status}`);

  const bobDelete = await api('DELETE', `/api/v1/cases/${caseId}`, bobToken);
  check('they cannot delete it', bobDelete.status === 404, `got ${bobDelete.status}`);

  const stillThere = await api('GET', `/api/v1/cases/${caseId}`, aliceToken);
  check('and it is still there for its owner', stillThere.status === 200);

  /* 4. The owner's own delete, and the cascade. */
  section('4. The owner can delete it');
  const del = await api('DELETE', `/api/v1/cases/${caseId}`, aliceToken);
  check('DELETE returns 204', del.status === 204, `got ${del.status}`);

  const gone = await api('GET', `/api/v1/cases/${caseId}`, aliceToken);
  check('it is then 404 for the owner too', gone.status === 404, `got ${gone.status}`);

  const { data: leftovers } = await admin.from('case_artifacts').select('id').eq('case_id', caseId);
  check('its artifacts cascaded away', (leftovers?.length ?? 0) === 0, `${leftovers?.length} left`);

  /* 5. A malformed id must not look like a server error. */
  section('5. Malformed input');
  const badId = await api('GET', '/api/v1/cases/not-a-uuid', aliceToken);
  check('a non-UUID id is 404, not 500', badId.status === 404, `got ${badId.status}`);
} catch (err) {
  fail += 1;
  failures.push(`harness: ${err instanceof Error ? err.message : String(err)}`);
  console.log(`\n  ERROR  ${err instanceof Error ? err.message : String(err)}`);
} finally {
  for (const id of users) await admin.auth.admin.deleteUser(id).catch(() => {});
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${pass} passed, ${fail} failed`);
  if (failures.length) { console.log('\nFailed:'); for (const f of failures) console.log(`  - ${f}`); }
  console.log('Test users deleted.');
  process.exit(fail === 0 ? 0 : 1);
}
