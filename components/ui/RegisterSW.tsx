'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker.
 *
 * Only in production: in development Next serves uncached, frequently
 * changing bundles, and a service worker in front of them causes stale-asset
 * confusion that looks like a bug in the app.
 */
export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const register = () => {
      void navigator.serviceWorker.register('/sw.js').catch(() => {
        /* Offline support is an enhancement; the app works without it. */
      });
    };
    // After load, so registration never competes with first paint.
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);
  return null;
}
