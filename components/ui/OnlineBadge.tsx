'use client';

import { useSyncExternalStore } from 'react';
import { getOnlineSnapshot, getServerOnlineSnapshot, subscribeOnline } from '@/lib/offline/connectivity';
import { Wifi, WifiOff } from './icons';
import { useT } from '@/components/i18n/LocaleProvider';

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
  const t = useT();
  return (
    <span className={`chip ${online ? '' : 'chip-check'}`} title={online ? t('app.online') : t('common.offlineNote')}>
      {online ? <Wifi /> : <WifiOff />}
      {online ? t('app.online') : t('app.offline')}
    </span>
  );
}
