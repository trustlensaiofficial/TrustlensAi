import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * Cross-user report isolation.
 *
 * The live database has no `user_id` column until migration 0003 is applied,
 * so these assert the *rules* the store enforces rather than hitting Supabase:
 * a behavioural test against the real table would pass today for the wrong
 * reason (the column is absent) and silently stop covering anything once it
 * exists. The exact wording of the refusal is load-bearing, so it is pinned.
 */
const store = readFileSync(new URL('../lib/store.ts', import.meta.url), 'utf8');
const analyze = readFileSync(new URL('../app/api/analyze/route.ts', import.meta.url), 'utf8');
const reportApi = readFileSync(new URL('../app/api/report/[id]/route.ts', import.meta.url), 'utf8');

describe('report ownership', () => {
  it('refuses an owned report to anyone but its owner', () => {
    expect(store).toMatch(/row\.user_id && row\.user_id !== viewerId/);
  });

  it('refuses indistinguishably from "not found"', () => {
    // Saying "exists but is not yours" confirms the id is real, which leaks.
    const refusal = store.match(/if \(row\.user_id && row\.user_id !== viewerId\) \{[\s\S]{0,160}?\}/)?.[0] ?? '';
    expect(refusal).toContain('No report exists with that id.');
    expect(refusal).not.toMatch(/forbidden|not yours|belongs to|unauthor/i);
  });

  it('routes the delete check through the same read rule', () => {
    // A second, separately written ownership check is a second place to get
    // it wrong, so delete reuses getReport.
    expect(store).toMatch(/const existing = await getReport\(id, viewerId\)/);
  });

  it('takes the owner from the session, never the request body', () => {
    expect(analyze).toMatch(/await getCurrentUser\(\)/);
    expect(analyze).toMatch(/saveReport\(report, user\?\.id \?\? null\)/);
    // A client-supplied owner would let anyone write into another account.
    expect(analyze).not.toMatch(/body\.userId|parsed\.data\.userId|userId:\s*z\./);
  });

  it('passes the verified viewer into both read and delete', () => {
    expect(reportApi).toMatch(/getReport\(id, viewer\?\.id \?\? null\)/);
    expect(reportApi).toMatch(/deleteReport\(id, viewer\?\.id \?\? null\)/);
  });

  it('keeps guest reports working when no owner is recorded', () => {
    // user_id null means a guest report: the capability URL still governs it.
    expect(store).toMatch(/user_id\?: string \| null/);
  });

  it('survives the migration not being applied yet', () => {
    expect(store).toMatch(/isMissingColumn/);
    expect(store).toMatch(/ownerColumn = 'absent'/);
    expect(store).toMatch(/0003_scans_owner\.sql/);
  });
});

describe('ownership migration is additive', () => {
  const sql = readFileSync(new URL('../supabase/migrations/0003_scans_owner.sql', import.meta.url), 'utf8');

  it('adds a nullable column and nothing destructive', () => {
    expect(sql).toMatch(/add column if not exists user_id uuid/i);
    expect(sql).not.toMatch(/\bdrop\s+(table|column|policy)\b/i);
    expect(sql).not.toMatch(/\bdelete\s+from\b/i);
    expect(sql).not.toMatch(/\btruncate\b/i);
  });

  it('does not open scans to browser roles', () => {
    // A permissive SELECT policy here would hand every signed-in user the
    // whole table — the opposite of what this migration is for.
    expect(sql).not.toMatch(/create policy/i);
    expect(sql).not.toMatch(/to authenticated/i);
  });
});
