'use client';

import { useEffect, useState } from 'react';
import { Help } from './icons';
import { useOnline } from './OnlineBadge';

interface Health {
  ok: boolean;
  capabilities: Record<string, boolean | string | null>;
}

/**
 * Says something only when a capability is actually missing.
 *
 * An earlier version showed four chips at all times, three of them green.
 * Telling someone that the thing they expected to work is working is noise —
 * it crowds the page and trains people to skim past the row, which is
 * exactly where the one real warning would sit. Silence now means healthy,
 * and anything on screen is something worth reading.
 */
export function CapabilityStrip() {
  const [health, setHealth] = useState<Health | null>(null);
  const online = useOnline();

  useEffect(() => {
    if (!online) return;
    let cancelled = false;
    void fetch('/api/health')
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setHealth(d as Health); })
      .catch(() => { /* Nothing to say; the page is useful regardless. */ });
    return () => { cancelled = true; };
  }, [online]);

  if (!online) {
    return (
      <p className="cap-note">
        <Help />
        You are offline. Saved reports and the emergency guidance still open; new checks need a connection.
      </p>
    );
  }

  if (!health) return null;

  const aiDown = health.capabilities.contextualAnalysis !== true;
  if (!aiDown) return null;

  return (
    <p className="cap-note">
      <Help />
      The AI explanation layer is unavailable right now. Every warning sign, the evidence and the next
      steps still work — they come from fixed rules, not the model.
    </p>
  );
}
