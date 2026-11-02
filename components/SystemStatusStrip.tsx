'use client';

import { useEffect, useState } from 'react';

interface HealthResponse {
  ok?: boolean;
  capabilities?: {
    deterministicRules?: boolean;
    liveUrlChecks?: boolean;
    contextualAnalysis?: boolean;
    contextualProvider?: string;
    reportHistory?: boolean;
  };
}

type Status = 'checking' | 'ready' | 'unavailable';

function Cell({ label, detail, status }: { label: string; detail: string; status: Status }) {
  return (
    <div className="system-cell" data-status={status}>
      <span className="system-indicator" aria-hidden="true" />
      <span className="system-copy">
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
      <span className="system-state">{status === 'ready' ? 'READY' : status === 'checking' ? 'CHECKING' : 'UNAVAILABLE'}</span>
    </div>
  );
}

/** Live capability readout. The UI only shows what /api/health confirms. */
export function SystemStatusStrip() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/health', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Health endpoint unavailable');
        const data = (await response.json()) as HealthResponse;
        setHealth(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, []);

  const caps = health?.capabilities;
  const status = (available: boolean | undefined): Status =>
    failed ? 'unavailable' : caps ? (available ? 'ready' : 'unavailable') : 'checking';

  return (
    <section className="system-strip" aria-label="Live product capabilities">
      <div className="system-strip-title">
        <span className="system-pulse" aria-hidden="true" />
        <strong>Live capability status</strong>
        <span>Confirmed by this deployment</span>
      </div>
      <div className="system-grid">
        <Cell label="Deterministic checks" detail="Core rules run without AI" status={status(caps?.deterministicRules)} />
        <Cell label="Link inspection" detail="DNS and page metadata checks" status={status(caps?.liveUrlChecks)} />
        <Cell label="Contextual AI" detail={caps?.contextualProvider ? `Provider: ${caps.contextualProvider}` : 'Rule-based fallback remains available'} status={status(caps?.contextualAnalysis)} />
        <Cell label="Report storage" detail="Server-side report persistence" status={status(caps?.reportHistory)} />
      </div>
      <p className="system-footnote">
        A ready capability means it is configured, not that every individual check will succeed. Each report records what actually ran.
      </p>
    </section>
  );
}
