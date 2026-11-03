'use client';

import { useEffect, useState } from 'react';
import { Check, Close, Help } from './icons';
import { useOnline } from './OnlineBadge';

interface Health {
  ok: boolean;
  capabilities: Record<string, boolean | string>;
}

const LABEL: Record<string, { on: string; off: string }> = {
  deterministicRules: { on: 'Rule engine running', off: 'Rule engine unavailable' },
  liveUrlChecks: { on: 'Live link checks', off: 'Live link checks off' },
  contextualAnalysis: { on: 'AI reading layer', off: 'AI layer unavailable' },
  reportHistory: { on: 'Saved to your account', off: 'Account history off' },
};

/**
 * What the system can actually do right now, read from /api/health.
 *
 * Deliberately not decorative: a capability shows as available only because
 * the server said so this minute. Offline, the whole strip reports what still
 * works locally rather than showing stale green ticks.
 */
export function CapabilityStrip() {
  const [health, setHealth] = useState<Health | null>(null);
  const online = useOnline();

  useEffect(() => {
    // Offline needs no state change: `online` already drives the fallback
    // during render. Setting state here synchronously would cascade a second
    // render for a value that is derivable.
    if (!online) return;
    let cancelled = false;
    void fetch('/api/health')
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setHealth(d as Health); })
      .catch(() => { /* The fallback below already says status is unknown. */ });
    return () => { cancelled = true; };
  }, [online]);

  // Derived, not stored: no connection, or no answer yet, both mean we cannot
  // claim a capability is live.
  if (!online || !health) {
    return (
      <div className="caps">
        <span className="cap cap-local"><Check /> Rules and link structure run on this device</span>
        <span className="cap cap-off"><Close /> {online ? 'Status unavailable' : 'Offline — live checks and AI paused'}</span>
      </div>
    );
  }

  return (
    <div className="caps">
      {Object.entries(LABEL).map(([key, words]) => {
        const on = health.capabilities[key] === true;
        return (
          <span key={key} className={`cap ${on ? 'cap-on' : 'cap-off'}`}>
            {on ? <Check /> : <Help />}
            {on ? words.on : words.off}
          </span>
        );
      })}
    </div>
  );
}
