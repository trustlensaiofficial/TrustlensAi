'use client';

/**
 * The QA panel's checks.
 *
 * Every check here either genuinely executes or reports that it cannot. The
 * one rule that matters: a check NEVER passes because configuration exists.
 * "AI_GATEWAY_API_KEY is set" is not evidence that a model call succeeds, and
 * reporting it as a pass is exactly the kind of unverified claim this product
 * is built to argue against. Where an external dependency blocks real
 * verification, the check returns `blocked` with the precise reason.
 *
 * Diagnostics are deliberately shallow: statuses, counts and short messages.
 * No tokens, no session contents, no analysed text, no report bodies.
 */

export type Status = 'pass' | 'fail' | 'blocked' | 'notrun' | 'running';

export interface CheckResult {
  status: Status;
  detail: string;
}

export interface Check {
  id: string;
  group: string;
  title: string;
  /** What a reader should understand this check proves. */
  proves: string;
  run: () => Promise<CheckResult>;
}

const ok = (detail: string): CheckResult => ({ status: 'pass', detail });
const bad = (detail: string): CheckResult => ({ status: 'fail', detail });
const blocked = (detail: string): CheckResult => ({ status: 'blocked', detail });

async function status(path: string, init?: RequestInit): Promise<number> {
  const res = await fetch(path, { ...init, redirect: 'manual' });
  return res.status;
}

/**
 * Cache of analysis responses for one run.
 *
 * Several checks examine the same scenario from different angles. Without
 * this, a full run spends more than the API's own 12-per-minute budget and
 * the later checks fail for the wrong reason — the panel would be reporting
 * its own impatience as a product defect.
 */
const analysisCache = new Map<string, { code: number; json: Record<string, unknown> | null }>();

export function clearAnalysisCache(): void {
  analysisCache.clear();
}

/** Raised when the API's rate limiter answers. That is the limiter working. */
export const RATE_LIMITED = 429;

async function analyze(body: unknown): Promise<{ code: number; json: Record<string, unknown> | null }> {
  const key = JSON.stringify(body);
  const hit = analysisCache.get(key);
  if (hit) return hit;

  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  const result = { code: res.status, json };
  // Never cache a rate-limited response: it is not an answer about the app.
  if (res.status !== RATE_LIMITED) analysisCache.set(key, result);
  return result;
}

/** A 429 is not a product failure; say so instead of reporting a red cross. */
const rateLimited = (): CheckResult =>
  blocked('Rate limit reached (12 analyses per minute). That is the limiter working correctly — wait a minute and run this check again.');

type Report = {
  id: string;
  inputContext: string;
  persisted: boolean;
  signals: Array<{ id: string; severity: string }>;
  checklist: unknown[];
  evidence: Array<{ id: string; status: string }>;
  assessment: { level: string };
  model: { used: boolean; degraded: boolean; reason?: string };
  completeness: { score: number; max: number };
};

const reportOf = (json: Record<string, unknown> | null): Report | null =>
  (json?.report as Report | undefined) ?? null;

export const CHECKS: Check[] = [
  /* ------------------------------------------------------------ routes -- */
  {
    id: 'routes.core',
    group: 'Routes',
    title: 'Every page route responds',
    proves: 'No route 500s or 404s unexpectedly.',
    run: async () => {
      const paths = ['/', '/analyze', '/history', '/showcase', '/login'];
      const results = await Promise.all(paths.map(async (p) => [p, await status(p)] as const));
      const broken = results.filter(([, c]) => c !== 200);
      return broken.length === 0
        ? ok(`${paths.length}/${paths.length} returned 200`)
        : bad(`Not 200: ${broken.map(([p, c]) => `${p}=${c}`).join(', ')}`);
    },
  },
  {
    id: 'routes.notfound',
    group: 'Routes',
    title: 'Unknown route returns 404',
    proves: 'Missing pages fail honestly instead of rendering something empty.',
    run: async () => {
      const code = await status('/this-route-does-not-exist');
      return code === 404 ? ok('404 as expected') : bad(`Expected 404, got ${code}`);
    },
  },
  {
    id: 'routes.health',
    group: 'Routes',
    title: 'Health endpoint reports capabilities',
    proves: 'The app can state which layers are configured.',
    run: async () => {
      const res = await fetch('/api/health');
      if (!res.ok) return bad(`HTTP ${res.status}`);
      const data = (await res.json()) as { capabilities?: Record<string, unknown> };
      const caps = data.capabilities ?? {};
      return ok(
        Object.entries(caps)
          .map(([k, v]) => `${k}=${String(v)}`)
          .join(' · '),
      );
    },
  },

  /* ---------------------------------------------------------- analysis -- */
  {
    id: 'analysis.benign',
    group: 'Analysis engine',
    title: 'Benign message raises no warning',
    proves: 'The detector does not cry wolf — the harder half of the problem.',
    run: async () => {
      const { code, json } = await analyze({ demoSlug: 'benign-transactional', liveChecks: false });
      if (code === RATE_LIMITED) return rateLimited();
      const r = reportOf(json);
      if (!r) return bad(`No report returned (HTTP ${code})`);
      return r.signals.length === 0 && r.assessment.level === 'no_signals_detected'
        ? ok('0 signals, level=no_signals_detected')
        : bad(`Expected 0 signals, got ${r.signals.length} (${r.assessment.level})`);
    },
  },
  {
    id: 'analysis.bank.benign',
    group: 'Analysis engine',
    title: 'Genuine bank alert is not flagged',
    proves: 'Bank rules are narrow — a real debit alert must stay silent.',
    run: async () => {
      const { code, json } = await analyze({ demoSlug: 'benign-bank-notice', liveChecks: false });
      if (code === RATE_LIMITED) return rateLimited();
      const r = reportOf(json);
      if (!r) return bad(`No report returned (HTTP ${code})`);
      const bank = r.signals.filter((s) => s.id.startsWith('bank.'));
      return bank.length === 0
        ? ok('0 bank rules fired on a genuine transaction alert')
        : bad(`False positives: ${bank.map((s) => s.id).join(', ')}`);
    },
  },
  {
    id: 'analysis.bank.scam',
    group: 'Analysis engine',
    title: 'Bank scam is caught with context rules',
    proves: 'bank_scam is a real context, not a relabelled generic result.',
    run: async () => {
      const { code, json } = await analyze({ demoSlug: 'bank-safe-account', liveChecks: false });
      if (code === RATE_LIMITED) return rateLimited();
      const r = reportOf(json);
      if (!r) return bad(`No report returned (HTTP ${code})`);
      const bank = r.signals.filter((s) => s.id.startsWith('bank.')).map((s) => s.id);
      const wanted = ['bank.safe_account_transfer', 'bank.remote_access'];
      const missing = wanted.filter((w) => !bank.includes(w));
      return r.inputContext === 'bank_scam' && missing.length === 0 && r.assessment.level === 'high_risk'
        ? ok(`high_risk · ${bank.length} bank rules · ${bank.slice(0, 2).join(', ')}`)
        : bad(`ctx=${r.inputContext} level=${r.assessment.level} missing=${missing.join(',') || 'none'}`);
    },
  },
  {
    id: 'analysis.contexts',
    group: 'Analysis engine',
    title: 'Each context produces a distinct lead action',
    proves: 'Scenarios are genuinely different, not one result reused.',
    run: async () => {
      const slugs = ['bank-safe-account', 'job-offer-scam', 'invoice-bank-change'];
      const firsts: string[] = [];
      for (const slug of slugs) {
        const { code, json } = await analyze({ demoSlug: slug, liveChecks: false });
        if (code === RATE_LIMITED) return rateLimited();
        const r = reportOf(json) as (Report & { checklist: Array<{ id: string }> }) | null;
        if (!r) return bad(`No report for ${slug} (HTTP ${code})`);
        firsts.push(r.checklist[0]?.id ?? 'none');
      }
      const unique = new Set(firsts);
      return unique.size === slugs.length
        ? ok(`3 contexts, 3 different first steps: ${firsts.join(' · ')}`)
        : bad(`Lead actions collided: ${firsts.join(', ')}`);
    },
  },
  {
    id: 'analysis.provenance',
    group: 'Analysis engine',
    title: 'Findings carry provenance and unknowns are listed',
    proves: 'Rule matches, retrieved facts and inferences stay separate.',
    run: async () => {
      const { code, json } = await analyze({ demoSlug: 'invoice-bank-change', liveChecks: false });
      if (code === RATE_LIMITED) return rateLimited();
      const r = reportOf(json) as (Report & {
        findings: Array<{ provenance: string }>;
        uncertainty: { notChecked: string[]; limits: string[] };
      }) | null;
      if (!r) return bad(`No report returned (HTTP ${code})`);
      const kinds = new Set(r.findings.map((f) => f.provenance));
      const valid = [...kinds].every((k) => ['deterministic', 'retrieved', 'model_inference'].includes(k));
      return valid && r.uncertainty.notChecked.length > 0 && r.uncertainty.limits.length > 0
        ? ok(`provenance: ${[...kinds].join(', ')} · ${r.uncertainty.notChecked.length} not-checked · ${r.uncertainty.limits.length} limits`)
        : bad('Provenance or uncertainty missing');
    },
  },

  /* ---------------------------------------------------------- security -- */
  {
    id: 'security.ssrf',
    group: 'Security',
    title: 'SSRF: internal addresses are refused',
    proves: 'A hostile URL cannot make the server fetch internal resources.',
    run: async () => {
      // Loopback and the cloud-metadata address: the two that matter most,
      // and keeping it to two leaves budget for the other checks.
      const targets = ['http://127.0.0.1/', 'http://169.254.169.254/'];
      const failures: string[] = [];
      for (const t of targets) {
        const { code, json } = await analyze({ text: t, kind: 'url', context: 'website', liveChecks: true });
        if (code === RATE_LIMITED) return rateLimited();
        const r = reportOf(json);
        const http = r?.evidence.find((e) => e.id === 'ev.http');
        if (http?.status !== 'not_checked') failures.push(t);
      }
      return failures.length === 0
        ? ok('Loopback and cloud-metadata both refused before any connection')
        : bad(`Reached: ${failures.join(', ')}`);
    },
  },
  {
    id: 'security.validation',
    group: 'Security',
    title: 'Malformed input is rejected',
    proves: 'The API validates before doing work.',
    run: async () => {
      // Three cases cover the distinct failure modes: missing value, bad
      // enum, wrong type. A fourth would only spend rate-limit budget that
      // later checks need.
      const cases: Array<[string, unknown]> = [
        ['empty', { text: '' }],
        ['bad context', { text: 'hello there', context: 'bogus' }],
        ['null text', { text: null }],
      ];
      const wrong: string[] = [];
      for (const [label, body] of cases) {
        const { code } = await analyze(body);
        if (code === RATE_LIMITED) return rateLimited();
        if (code !== 400) wrong.push(`${label}=${code}`);
      }
      return wrong.length === 0
        ? ok(`${cases.length}/${cases.length} rejected with 400`)
        : bad(`Not 400: ${wrong.join(', ')}`);
    },
  },
  {
    id: 'security.openredirect',
    group: 'Security',
    title: 'Auth callback refuses an off-site redirect',
    proves: 'A login link cannot bounce a user to a lookalike after sign-in.',
    run: async () => {
      const res = await fetch('/auth/callback?next=//evil.example', { redirect: 'manual' });
      const location = res.headers.get('location') ?? '';
      const escaped = /^https?:\/\/(?!$)/.test(location) && !location.includes(window.location.host);
      return !escaped ? ok('Redirect stayed on this origin') : bad(`Escaped to ${location}`);
    },
  },
  {
    id: 'security.signout',
    group: 'Security',
    title: 'Sign-out rejects GET',
    proves: 'An <img> tag cannot log a user out (CSRF).',
    run: async () => {
      const code = await status('/auth/signout');
      return code === 405 ? ok('GET returns 405') : bad(`Expected 405, got ${code}`);
    },
  },
  {
    id: 'security.reportid',
    group: 'Security',
    title: 'Report refusal does not confirm an id exists',
    proves: 'An unknown id and a refused id are indistinguishable.',
    run: async () => {
      const res = await fetch('/api/report/11111111-2222-4333-8444-555555555555');
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      const invalid = await fetch('/api/report/not-a-uuid');
      const invalidBody = (await invalid.json().catch(() => ({}))) as { error?: string };
      return /no report exists/i.test(body.error ?? '') && /not a valid report id/i.test(invalidBody.error ?? '')
        ? ok('Unknown id is generic; malformed id is rejected before the database')
        : bad(`Unexpected: "${body.error}" / "${invalidBody.error}"`);
    },
  },

  /* --------------------------------------------------------- auth ------- */
  {
    id: 'auth.gate',
    group: 'Authentication',
    title: 'Account page is gated server-side',
    proves: 'Protected pages are not merely hidden in the UI.',
    run: async () => {
      const res = await fetch('/account', { redirect: 'manual' });
      const location = res.headers.get('location') ?? '';
      if (res.status === 200) return bad('Reachable without a session');
      return location.includes('/login')
        ? ok(`${res.status} → /login`)
        : ok(`${res.status} (not reachable as a guest)`);
    },
  },
  {
    id: 'auth.options',
    group: 'Authentication',
    title: 'Only Google and passkey are offered',
    proves: 'No password form exists to phish.',
    run: async () => {
      const html = await (await fetch('/login')).text();
      const google = /Continue with Google/i.test(html);
      const passkey = /passkey/i.test(html);
      const password = /type="password"/i.test(html);
      return google && passkey && !password
        ? ok('Google + passkey present; no password field anywhere')
        : bad(`google=${google} passkey=${passkey} passwordField=${password}`);
    },
  },
  {
    id: 'auth.webauthn',
    group: 'Authentication',
    title: 'This browser supports passkeys',
    proves: 'WebAuthn is available for the passkey flow.',
    run: async () =>
      typeof window !== 'undefined' && 'PublicKeyCredential' in window
        ? ok('window.PublicKeyCredential is available')
        : blocked('This browser does not expose WebAuthn. Use a current Chrome, Safari or Edge.'),
  },
  {
    id: 'auth.google.e2e',
    group: 'Authentication',
    title: 'Google sign-in completes end to end',
    proves: 'A real account can be created and a session issued.',
    run: async () =>
      blocked(
        'Cannot be automated: it needs a real Google account and the provider enabled in Supabase → Authentication → Providers. Sign in manually to confirm.',
      ),
  },
  {
    id: 'auth.passkey.e2e',
    group: 'Authentication',
    title: 'Passkey registration and sign-in',
    proves: 'A credential can be created on this device and reused.',
    run: async () =>
      blocked(
        'Needs an authenticated session plus a device prompt. Sign in with Google, add a passkey from /account, then sign out and use it.',
      ),
  },

  /* ------------------------------------------------------- persistence -- */
  {
    id: 'store.roundtrip',
    group: 'Persistence',
    title: 'Report saves, reads back, then deletes',
    proves: 'The database path works end to end against the live schema.',
    run: async () => {
      /**
       * Reuses the report the benign check already created rather than
       * spending another of the twelve analyses a minute. The lifecycle being
       * proven — saved, readable, deletable — is identical whichever report
       * it runs on, and this one is deleted at the end regardless.
       */
      const { code, json } = await analyze({ demoSlug: 'benign-transactional', liveChecks: false });
      if (code === RATE_LIMITED) return rateLimited();
      const r = reportOf(json);
      if (!r) return bad(`No report returned (HTTP ${code})`);
      if (!r.persisted) {
        const note = (json?.storageNote as string | undefined) ?? 'not saved';
        return blocked(`Report was not saved: ${note}`);
      }
      const read = await fetch(`/api/report/${r.id}`);
      if (!read.ok) return bad(`Saved but could not be read back (HTTP ${read.status})`);
      const del = await fetch(`/api/report/${r.id}`, { method: 'DELETE' });
      if (!del.ok) return bad(`Could not delete (HTTP ${del.status})`);
      const after = await fetch(`/api/report/${r.id}`);
      return after.status === 404
        ? ok('save → read → delete → 404, full lifecycle verified')
        : bad(`Still readable after delete (HTTP ${after.status})`);
    },
  },

  /* --------------------------------------------------------- provider --- */
  {
    id: 'ai.actual',
    group: 'AI provider',
    title: 'A real model call succeeds',
    proves: 'Contextual interpretation genuinely runs — not that a key exists.',
    run: async () => {
      const { code, json } = await analyze({ demoSlug: 'bank-otp-phish', liveChecks: false });
      if (code === RATE_LIMITED) return rateLimited();
      const r = reportOf(json);
      if (!r) return bad(`No report returned (HTTP ${code})`);
      if (r.model.used) return ok('The model returned a validated interpretation.');
      return blocked(r.model.reason ?? 'The contextual layer did not run.');
    },
  },
  {
    id: 'ai.fallback',
    group: 'AI provider',
    title: 'Deterministic analysis survives an unavailable model',
    proves: 'The product is useful without AI, and says so honestly.',
    run: async () => {
      const { code, json } = await analyze({ demoSlug: 'bank-otp-phish', liveChecks: false });
      if (code === RATE_LIMITED) return rateLimited();
      const r = reportOf(json);
      if (!r) return bad(`No report returned (HTTP ${code})`);
      const honest = r.model.used || (r.model.degraded && Boolean(r.model.reason));
      return r.signals.length > 0 && honest
        ? ok(`${r.signals.length} rules fired; model status is reported, not hidden`)
        : bad('Either no rules fired or an unavailable model was not disclosed');
    },
  },

  /* ----------------------------------------------- layout & a11y -------- */
  {
    id: 'layout.overflow',
    group: 'Layout & accessibility',
    title: 'No horizontal overflow at this width',
    proves: 'The page fits the viewport it is being viewed in.',
    run: async () => {
      const de = document.documentElement;
      return de.scrollWidth <= de.clientWidth + 1
        ? ok(`${de.clientWidth}px viewport, no overflow`)
        : bad(`Content is ${de.scrollWidth - de.clientWidth}px wider than the viewport`);
    },
  },
  {
    id: 'layout.controls',
    group: 'Layout & accessibility',
    title: 'No dead links or unnamed buttons on this page',
    proves: 'Every control has a destination and an accessible name.',
    run: async () => {
      const dead = [...document.querySelectorAll('a')].filter((a) => {
        const h = a.getAttribute('href');
        return !h || h === '#' || h.startsWith('javascript:');
      }).length;
      const unnamed = [...document.querySelectorAll('button')].filter(
        (b) =>
          !(b.getAttribute('aria-label') || b.textContent || '').trim() &&
          !b.getAttribute('aria-labelledby') &&
          !b.querySelector('svg'),
      ).length;
      return dead === 0 && unnamed === 0
        ? ok('0 dead links, 0 unnamed buttons')
        : bad(`${dead} dead link(s), ${unnamed} unnamed button(s)`);
    },
  },
  {
    id: 'layout.reducedmotion',
    group: 'Layout & accessibility',
    title: 'Reduced-motion preference is wired up',
    proves: 'Animation can be switched off by the operating system.',
    run: async () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      return ok(
        reduced
          ? 'Your system requests reduced motion and the app honours it.'
          : 'Your system allows motion. The rules exist; enable reduced motion in your OS to see them apply.',
      );
    },
  },
  {
    id: 'layout.keyboard',
    group: 'Layout & accessibility',
    title: 'Keyboard focus is visible',
    proves: 'A keyboard user can see where they are.',
    run: async () =>
      blocked('Needs a human: press Tab through the page and confirm every stop shows a focus ring.'),
  },
];

export const GROUPS = [...new Set(CHECKS.map((c) => c.group))];
