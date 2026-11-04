import type { Report } from '../analysis/types';

/**
 * Reports kept on the user's own device.
 *
 * IndexedDB rather than localStorage because reports are structured documents
 * of real size, and localStorage is synchronous and string-only — a long
 * history would block the main thread on every read.
 *
 * Nothing here is uploaded. This store exists so history survives a reload,
 * works with no network, and keeps working for someone who never signs in.
 * Signed-in users additionally get server-side history; this is the floor,
 * not a replacement for it.
 */

const DB = 'trustlens';
const STORE = 'reports';
const VERSION = 1;
/** Keeps the device store bounded; the newest survive. */
const MAX_REPORTS = 60;

export interface StoredReport {
  id: string;
  createdAt: string;
  level: Report['assessment']['level'];
  headline: string;
  preview: string;
  context: Report['inputContext'];
  signalCount: number;
  report: Report;
}

function open(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB, VERSION);
    } catch {
      // Private browsing and hardened settings can throw on open.
      resolve(null);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  return new Promise(async (resolve) => {
    const db = await open();
    if (!db) {
      resolve(null);
      return;
    }
    try {
      const t = db.transaction(STORE, mode);
      const req = run(t.objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      t.oncomplete = () => db.close();
    } catch {
      resolve(null);
    }
  });
}

/** Everything the device holds, newest first. */
export async function listLocalReports(): Promise<StoredReport[]> {
  const all = await tx<StoredReport[]>('readonly', (s) => s.getAll() as IDBRequest<StoredReport[]>);
  if (!all) return [];
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getLocalReport(id: string): Promise<StoredReport | null> {
  const one = await tx<StoredReport>('readonly', (s) => s.get(id) as IDBRequest<StoredReport>);
  return one ?? null;
}

export async function saveLocalReport(report: Report): Promise<void> {
  const row: StoredReport = {
    id: report.id,
    createdAt: report.createdAt,
    level: report.assessment.level,
    headline: report.assessment.headline,
    preview: report.inputPreview,
    context: report.inputContext,
    signalCount: report.signals.length,
    report,
  };
  await tx('readwrite', (s) => s.put(row) as IDBRequest<IDBValidKey>);
  await trim();
}

export async function deleteLocalReport(id: string): Promise<void> {
  await tx('readwrite', (s) => s.delete(id) as unknown as IDBRequest<undefined>);
}

export async function clearLocalReports(): Promise<void> {
  await tx('readwrite', (s) => s.clear() as unknown as IDBRequest<undefined>);
}

/** Drops the oldest rows once the store passes its cap. */
async function trim(): Promise<void> {
  const all = await listLocalReports();
  if (all.length <= MAX_REPORTS) return;
  for (const row of all.slice(MAX_REPORTS)) {
    await deleteLocalReport(row.id);
  }
}
