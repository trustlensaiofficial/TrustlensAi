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

/* v3: the page cache is keyed by language, and the precache list follows the
   vector icons and the share-target route. */
const VERSION = 'tl-v3';
const SHELL = `${VERSION}-shell`;
const PAGES = `${VERSION}-pages`;

/* Routes worth having before they are first visited — the ones someone needs
   in a crisis, when they are least likely to have a good connection.
   `/share` is here because the Android share sheet can hand a message to an
   installed app that has no connection, and landing on the offline page at
   that moment would waste the one thing the person was trying to do. */
const PRECACHE = [
  '/',
  '/home',
  '/check',
  '/share',
  '/respond',
  '/activity',
  '/privacy',
  '/offline',
  '/icon.svg',
  '/brand/icon-192.png',
  '/brand/mark.svg',
  '/manifest.webmanifest',
];

/**
 * The language this browser has chosen, or 'default'.
 *
 * Needed because server-rendered HTML is now localised and the responses do
 * NOT carry `Vary: Cookie` — so a cache keyed on URL alone would store the
 * Tamil copy of /home and later serve it to someone who had switched to
 * English and gone offline. The Cache API honours Vary, but only if the
 * server sends it, and Next does not send it for a cookie read in a server
 * component.
 *
 * `cookieStore` is the only way a service worker can read a cookie — the
 * Cookie header is not exposed on the requests it sees. It is Chromium-only,
 * which covers Android and the installed-PWA case this matters most for.
 * Everywhere else every language shares one bucket, which is exactly the
 * behaviour before this change: a possible wrong-language offline page, and
 * never a wrong answer.
 */
async function languageBucket() {
  try {
    const cookie = await self.cookieStore?.get('trustlens.lang');
    return cookie?.value || 'default';
  } catch {
    return 'default';
  }
}

/** The cache key for a page: its URL, tagged with the language it is in. */
function pageKey(request, bucket) {
  const url = new URL(request.url);
  url.searchParams.set('__tl_lang', bucket);
  return new Request(url.toString(), { headers: request.headers });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      // Individually, so one 404 cannot fail the whole install.
      await Promise.allSettled(PRECACHE.map((url) => cache.add(url)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
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
      (async () => {
        const bucket = await languageBucket();
        const key = pageKey(request, bucket);
        try {
          const res = await fetch(request);
          if (res.ok) {
            const copy = res.clone();
            void caches.open(PAGES).then((c) => c.put(key, copy));
          }
          return res;
        } catch {
          return (
            (await caches.match(key)) ??
            // A page this language has never opened, but English might have.
            (await caches.match(request)) ??
            (await caches.match('/offline')) ??
            Response.error()
          );
        }
      })(),
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
