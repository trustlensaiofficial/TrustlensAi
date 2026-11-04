/**
 * Connectivity, as an external store.
 *
 * React 19 forbids setState inside an effect, and `navigator.onLine` is a
 * browser value that changes outside React — so it is read through
 * `useSyncExternalStore` rather than mirrored into state. The server snapshot
 * is `true` so the first server render never claims the user is offline.
 */
type Listener = () => void;

const listeners = new Set<Listener>();
let bound = false;

function emit() {
  for (const l of listeners) l();
}

function bind() {
  if (bound || typeof window === 'undefined') return;
  bound = true;
  window.addEventListener('online', emit);
  window.addEventListener('offline', emit);
}

export function subscribeOnline(onChange: Listener): () => void {
  bind();
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function getOnlineSnapshot(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

/** Optimistic on the server: a page must never render "offline" before hydration. */
export function getServerOnlineSnapshot(): boolean {
  return true;
}
