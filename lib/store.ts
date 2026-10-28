import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Report } from './analysis/types';

/**
 * Report persistence.
 *
 * Access model, chosen to satisfy "store history securely" without putting a
 * login in front of the product:
 *
 *  - Writes and reads happen ONLY through this server-side module, using the
 *    service-role key. That key never reaches the browser.
 *  - Row Level Security is enabled on the table with no policies granted to
 *    `anon` or `authenticated`, so a leaked publishable key still reads nothing.
 *  - A report is addressed by its UUID, which is unguessable, and there is
 *    deliberately NO endpoint that lists reports. The browser keeps its own
 *    index of ids in localStorage, so one visitor's history is never derivable
 *    from the server. That is how we avoid exposing other people's scans.
 *
 * If the environment is not configured, every function degrades to a clear
 * "not enabled" result. The UI then states that history is unavailable rather
 * than implying a report was saved.
 */

export interface StoreStatus {
  enabled: boolean;
  reason?: string;
}

/**
 * Treats an empty or whitespace-only variable as absent.
 *
 * `??` only falls through on null/undefined, so a variable that exists in the
 * dashboard but holds an empty string would otherwise shadow the correctly set
 * alternative name. One project in this account is in exactly that state.
 */
function envValue(...names: string[]): string | undefined {
  for (const name of names) {
    const raw = process.env[name];
    if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
  }
  return undefined;
}

function readEnv(): { url?: string; key?: string } {
  // Accept either the names the Vercel/Supabase integration injects or the
  // plain ones, so the same code works however the project was wired.
  return {
    url: envValue('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'),
    key: envValue('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY'),
  };
}

/**
 * A Supabase project URL must be an https origin. Checking this explicitly
 * turns a confusing runtime failure into a clear message: at least one project
 * in this account has a SUPABASE_URL holding a base64 blob rather than a URL,
 * which would otherwise surface as an opaque client error on first write.
 */
function isValidProjectUrl(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

export function storeStatus(): StoreStatus {
  const { url, key } = readEnv();
  if (!url && !key) {
    return { enabled: false, reason: 'No Supabase URL or server key is configured on this deployment, so reports are not saved.' };
  }
  if (!url) return { enabled: false, reason: 'Supabase URL is missing, so reports are not saved.' };
  if (!isValidProjectUrl(url)) {
    return {
      enabled: false,
      reason:
        'The configured Supabase URL is not a valid https address, so reports are not saved. Check the SUPABASE_URL environment variable — it should look like https://<project-ref>.supabase.co.',
    };
  }
  if (!key) return { enabled: false, reason: 'Supabase server key is missing, so reports are not saved.' };
  return { enabled: true };
}

let cached: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (cached) return cached;
  const { url, key } = readEnv();
  if (!url || !key) return null;
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-application-name': 'trustlens-ai' } },
  });
  return cached;
}

/** Row shape written to `public.scans`. Keep in sync with the migration. */
interface ScanRow {
  id: string;
  input_kind: string;
  input_preview: string;
  assessment_level: string;
  signal_score: number;
  report: unknown;
  is_demo: boolean;
  created_at: string;
}

/**
 * Persists a report. Returns whether the write actually succeeded so the
 * caller can set `report.persisted` truthfully.
 */
export async function saveReport(report: Report): Promise<{ saved: boolean; reason?: string }> {
  const status = storeStatus();
  if (!status.enabled) return { saved: false, reason: status.reason };

  const client = getClient();
  if (!client) return { saved: false, reason: 'Supabase client could not be created.' };

  const row: ScanRow = {
    id: report.id,
    input_kind: report.inputKind,
    input_preview: report.inputPreview,
    assessment_level: report.assessment.level,
    signal_score: report.assessment.signalScore,
    report: report,
    is_demo: report.isDemo,
    created_at: report.createdAt,
  };

  const { error } = await client.from('scans').insert(row);
  if (error) {
    // Never log the row itself; it contains the analysed content.
    console.error('[trustlens] report insert failed:', error.code ?? '', error.message.slice(0, 160));
    const missingTable = error.code === '42P01' || /relation .*scans.* does not exist/i.test(error.message);
    return {
      saved: false,
      reason: missingTable
        ? 'The `scans` table does not exist yet. Apply supabase/migrations/0001_scans.sql, then history will work.'
        : 'The report could not be saved to the database.',
    };
  }
  return { saved: true };
}

/** Fetches one report by its unguessable id. There is no list equivalent. */
export async function getReport(id: string): Promise<{ report: Report | null; reason?: string }> {
  const status = storeStatus();
  if (!status.enabled) return { report: null, reason: status.reason };

  // Reject anything that is not a UUID before it reaches the database.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return { report: null, reason: 'That is not a valid report id.' };
  }

  const client = getClient();
  if (!client) return { report: null, reason: 'Supabase client could not be created.' };

  const { data, error } = await client.from('scans').select('report').eq('id', id).maybeSingle();
  if (error) {
    console.error('[trustlens] report fetch failed:', error.code ?? '', error.message.slice(0, 160));
    return { report: null, reason: 'The report could not be retrieved.' };
  }
  if (!data) return { report: null, reason: 'No report exists with that id.' };

  const stored = (data as { report: Report }).report;
  return { report: { ...stored, persisted: true } };
}

/** Deletes one report. Used by the history page's remove action. */
export async function deleteReport(id: string): Promise<{ deleted: boolean; reason?: string }> {
  const status = storeStatus();
  if (!status.enabled) return { deleted: false, reason: status.reason };
  const client = getClient();
  if (!client) return { deleted: false, reason: 'Supabase client could not be created.' };
  const { error } = await client.from('scans').delete().eq('id', id);
  if (error) {
    console.error('[trustlens] report delete failed:', error.code ?? '', error.message.slice(0, 160));
    return { deleted: false, reason: 'The report could not be deleted.' };
  }
  return { deleted: true };
}
