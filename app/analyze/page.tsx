import type { Metadata } from 'next';
import { AnalyzeWorkspace } from '@/components/AnalyzeWorkspace';
import { AppShell } from '@/components/AppShell';

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
            Analysis workspace
          </p>
          <h1 style={{ fontSize: 'clamp(28px, 3.6vw, 42px)', marginTop: 14 }}>
            What would you like to check?
          </h1>
          <p className="lede" style={{ marginTop: 14, maxWidth: '64ch' }}>
            Paste the full text so the wording can be examined. Links inside a message are checked
            too. Everything runs server-side, and your input is treated strictly as data.
          </p>
        </section>
        <div id="examples" />
        <AnalyzeWorkspace />
    </AppShell>
  );
}
