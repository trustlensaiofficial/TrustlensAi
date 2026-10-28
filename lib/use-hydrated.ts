'use client';

import { useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};
const onClient = () => true;
const onServer = () => false;

/**
 * True only after hydration.
 *
 * Uses useSyncExternalStore rather than an effect so that components which
 * depend on browser-only state (localStorage, the resolved theme) can render a
 * correct placeholder during SSR without a setState-in-effect cascade.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, onClient, onServer);
}
