import type { Metadata } from 'next';
import { AnalyzeWorkspace } from '@/components/AnalyzeWorkspace';
import { AppShell } from '@/components/AppShell';
import { SystemStatusStrip } from '@/components/SystemStatusStrip';

export const metadata: Metadata = {
  title: 'Analyze',
  description:
    'Paste a message, link or claim to see its warning signs, the evidence behind them, what could not be verified, and how to check it safely.',
};

export default function AnalyzePage() {
  return (
    <AppShell>
        <section style={{ padding: 'clamp(28px, 4vw, 48px) 0 clamp(18px, 2.4vw, 26px)' }}>
          <p className="eyebrow">
            <span className="dot" />
            TRUSTLENS INVESTIGATION WORKSPACE
          </p>
          <h1 style={{ fontSize: 'clamp(28px, 3.6vw, 42px)', marginTop: 14 }}>
            Pause. Verify. Then act.
          </h1>
          <p className="lede" style={{ marginTop: 14, maxWidth: '64ch' }}>
            Investigate a suspicious message, payment request, job offer or website before you act. TrustLens combines reproducible warning-sign rules, real checks it can safely perform, and clearly labelled AI interpretation — then turns the findings into practical next steps.
          </p>
        </section>
        <SystemStatusStrip />
        <div id="examples" />
        <AnalyzeWorkspace />
    </AppShell>
  );
}
