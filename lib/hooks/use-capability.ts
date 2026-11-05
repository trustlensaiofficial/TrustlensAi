'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Reading browser capabilities without an effect.
 *
 * The obvious shape — `useState(false)` then `setState(probe())` in a
 * `useEffect` — renders twice on every mount: once with the wrong answer,
 * once with the right one. React 19's `react-hooks/set-state-in-effect` flags
 * it, and on a glass card that means mounting without the refractive rim and
 * then tearing it down and rebuilding it a frame later, on exactly the
 * low-end devices the fallback exists to protect.
 *
 * `useSyncExternalStore` asks the question during the render that has to
 * happen anyway, and gives the server its own answer so SSR and the first
 * client paint agree.
 */

/** Subscribe-to-nothing, for a value that cannot change after load. */
const NEVER = () => () => {};

/**
 * A one-shot capability probe.
 *
 * `read` must return a primitive. React calls it on every render and compares
 * with `Object.is`, so anything that allocates — an object, an array — would
 * spin forever.
 */
export function useProbe<T extends string | number | boolean>(read: () => T, onServer: T): T {
  const get = useCallback(() => {
    if (typeof window === 'undefined') return onServer;
    return read();
  }, [read, onServer]);
  return useSyncExternalStore(NEVER, get, () => onServer);
}

/**
 * A live media query.
 *
 * Unlike `useProbe` this really does change — rotating a tablet, docking a
 * laptop, or turning on Reduce Motion mid-session — so it subscribes.
 */
export function useMediaQuery(query: string, onServer = false): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const list = window.matchMedia(query);
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    [query],
  );

  const get = useCallback(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return onServer;
    return window.matchMedia(query).matches;
  }, [query, onServer]);

  return useSyncExternalStore(subscribe, get, () => onServer);
}

/** Whether the device has a real pointer, as opposed to a finger. */
export function useFinePointer(): boolean {
  return useMediaQuery('(hover: hover) and (pointer: fine)');
}

/**
 * Whether the device is touch-driven.
 *
 * Not simply the inverse of `useFinePointer`: a laptop with a touchscreen is
 * both, and the two questions have different answers for different purposes —
 * one asks "will hover work", the other "will a press feel like a press".
 */
export function useTouchDevice(): boolean {
  return useProbe(
    () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    false,
  );
}
