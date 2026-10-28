import type { AssessmentLevel, InputContext, InputKind } from './analysis/types';

/**
 * Per-browser history index, exposed as an external store.
 *
 * The server deliberately has no "list reports" endpoint, so the only record
 * of which reports belong to this visitor lives here in their own browser.
 * That is what keeps one person's scans unreachable from another's session.
 *
 * It is modelled as a subscribable store so components can read it through
 * useSyncExternalStore: localStorage is genuinely external state, and reading
 * it in an effect would cause a cascading render on every mount.
 */

const KEY = 'trustlens.history.v1';
const MAX_ENTRIES = 50;

export interface HistoryEntry {
  id: string;
  preview: string;
  kind: InputKind;
  level: AssessmentLevel;
  createdAt: string;
  isDemo: boolean;
  /** False when the server could not save it, so history cannot reload it. */
  persisted: boolean;
  /** Optional: entries written before contexts existed will not have it. */
  context?: InputContext;
}

/** Stable empty reference: getSnapshot must not return a fresh array each call. */
const EMPTY: readonly HistoryEntry[] = Object.freeze([]);

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedValue: readonly HistoryEntry[] = EMPTY;
let primed = false;

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function writeRaw(value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, value);
  } catch {
    /* history simply will not persist in this browser */
  }
  emit();
}

function parse(raw: string | null): readonly HistoryEntry[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const valid = parsed.filter(
      (e): e is HistoryEntry =>
        typeof e === 'object' &&
        e !== null &&
        typeof (e as HistoryEntry).id === 'string' &&
        typeof (e as HistoryEntry).createdAt === 'string',
    );
    return valid.length === 0 ? EMPTY : valid;
  } catch {
    return EMPTY;
  }
}

function emit(): void {
  // Force the next getSnapshot to re-parse.
  primed = false;
  for (const listener of listeners) listener();
}

export function subscribeHistory(onChange: () => void): () => void {
  listeners.add(onChange);
  // Another tab writing the same key should update this one.
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === KEY) emit();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onStorage);
  };
}

/** Returns a cached reference, so repeated calls are reference-stable. */
export function getHistorySnapshot(): readonly HistoryEntry[] {
  const raw = readRaw();
  if (!primed || raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = parse(raw);
    primed = true;
  }
  return cachedValue;
}

export function getHistoryServerSnapshot(): readonly HistoryEntry[] {
  return EMPTY;
}

export function addToHistory(entry: HistoryEntry): void {
  const next = [entry, ...getHistorySnapshot().filter((e) => e.id !== entry.id)].slice(0, MAX_ENTRIES);
  writeRaw(JSON.stringify(next));
}

export function removeFromHistory(id: string): void {
  writeRaw(JSON.stringify(getHistorySnapshot().filter((e) => e.id !== id)));
}

export function clearHistory(): void {
  writeRaw(null);
}
