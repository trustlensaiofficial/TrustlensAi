'use client';

import { useSyncExternalStore } from 'react';
import { getOnlineSnapshot, getServerOnlineSnapshot, subscribeOnline } from '@/lib/offline/connectivity';
import { Wifi, WifiOff } from './icons';

export function useOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getServerOnlineSnapshot);
}

/**
 * Shows connectivity, because it changes what the product can actually do.
 * Offline, the deterministic engine still runs; live link checks and the AI
 * layer do not. Saying so is more useful than hiding it.
 */
export function OnlineBadge() {
  const online = useOnline();
  return (
    <span className={`chip ${online ? '' : 'chip-check'}`} title={online ? 'Connected' : 'Offline — local checks still run'}>
      {online ? <Wifi /> : <WifiOff />}
      {online ? 'Online' : 'Offline'}
    </span>
  );
}
