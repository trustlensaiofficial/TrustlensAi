/**
 * One-time dismissals (onboarding hints).
 *
 * Modelled as an external store for the same reason as the other browser
 * state: reading localStorage inside an effect causes a cascading render, and
 * React 19's hooks rules reject it.
 */

const KEY = 'trustlens.dismissed.v1';

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedSet: ReadonlySet<string> = new Set();
let primed = false;

const EMPTY: ReadonlySet<string> = new Set();

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function load(): ReadonlySet<string> {
  const raw = readRaw();
  if (!primed || raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      cachedSet = new Set(Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []);
    } catch {
      cachedSet = new Set();
    }
    primed = true;
  }
  return cachedSet;
}

export function subscribeDismissed(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === KEY) {
      primed = false;
      for (const l of listeners) l();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onStorage);
  };
}

export function getDismissed(): ReadonlySet<string> {
  return load();
}

export function getServerDismissed(): ReadonlySet<string> {
  return EMPTY;
}

export function dismiss(id: string): void {
  const next = new Set(load());
  next.add(id);
  try {
    localStorage.setItem(KEY, JSON.stringify([...next]));
  } catch {
    /* the dismissal simply will not persist */
  }
  primed = false;
  for (const l of listeners) l();
}
