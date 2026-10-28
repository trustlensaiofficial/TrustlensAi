/**
 * Per-report checklist progress.
 *
 * Kept in the browser rather than the database on purpose: which safety steps
 * someone has personally carried out is sensitive, it belongs to the person
 * rather than the report, and storing it server-side would mean one anonymous
 * visitor's progress could be read from another's session. Modelled as an
 * external store so components read it through useSyncExternalStore.
 */

const KEY = 'trustlens.checklist.v1';

type ProgressMap = Record<string, string[]>;

const EMPTY: readonly string[] = Object.freeze([]);
const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedMap: ProgressMap = {};
let primed = false;

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function load(): ProgressMap {
  const raw = readRaw();
  if (!primed || raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : {};
      cachedMap = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as ProgressMap) : {};
    } catch {
      cachedMap = {};
    }
    primed = true;
  }
  return cachedMap;
}

function emit(): void {
  primed = false;
  for (const l of listeners) l();
}

export function subscribeProgress(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === KEY) emit();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onStorage);
  };
}

/** Reference-stable per report id, as useSyncExternalStore requires. */
const perReport = new Map<string, readonly string[]>();

export function getDoneSteps(reportId: string): readonly string[] {
  const map = load();
  const next = map[reportId] ?? EMPTY;
  const prev = perReport.get(reportId);
  if (prev && prev.length === next.length && prev.every((v, i) => v === next[i])) return prev;
  const frozen = Object.freeze([...next]);
  perReport.set(reportId, frozen);
  return frozen;
}

export function getServerDoneSteps(): readonly string[] {
  return EMPTY;
}

export function toggleStep(reportId: string, stepId: string): void {
  const map = { ...load() };
  const current = new Set(map[reportId] ?? []);
  if (current.has(stepId)) current.delete(stepId);
  else current.add(stepId);
  if (current.size === 0) delete map[reportId];
  else map[reportId] = [...current];
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* progress simply will not persist in this browser */
  }
  emit();
}

export function clearProgress(reportId: string): void {
  const map = { ...load() };
  delete map[reportId];
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* nothing to do */
  }
  emit();
}
