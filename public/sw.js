/*
 * TrustLens service worker.
 *
 * Campus Wi-Fi at a hackathon is unreliable, and a security tool that dies
 * with the network is not much of a security tool. The goal is narrow and
 * honest: the app opens, the saved reports open, and the emergency guidance
 * is readable, with no connection at all.
 *
 * What is deliberately NOT cached: /api/*. A cached analysis would be a stale
 * answer presented as a fresh one, which is the exact failure this product
 * exists to argue against. Offline, an analysis fails loudly and the UI says
 * why.
 */

const VERSION = 'tl-v2';
const SHELL = `${VERSION}-shell`;
const PAGES = `${VERSION}-pages`;

/* Routes worth having before they are first visited — the ones someone needs
   in a crisis, when they are least likely to have a good connection. */
const PRECACHE = ['/', '/check', '/respond', '/activity', '/privacy', '/offline', '/logo-mark.png', '/icon.svg', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      // Individually, so one 404 cannot fail the whole install.
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never serve an analysis, a health check or an auth response from cache.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return;

  // Build output is content-hashed, so it can be cached permanently.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              void caches.open(SHELL).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Pages: network first so content stays fresh, cache as the fallback, and
  // the offline page only when there is nothing stored at all.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            void caches.open(PAGES).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(request)) ?? (await caches.match('/offline')) ?? Response.error()),
    );
    return;
  }

  // Everything else: cache first, refresh in the background.
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ??
        fetch(request).then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            void caches.open(SHELL).then((c) => c.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
