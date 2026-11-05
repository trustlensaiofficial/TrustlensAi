import type { Metadata } from 'next';
import { Shell } from '@/components/ui/Shell';
import { CheckWorkspace } from '@/components/ui/CheckWorkspace';
import type { InputContext } from '@/lib/analysis/types';

export const metadata: Metadata = {
  title: 'Check something',
  description: 'Investigate a message, website, job offer, invoice or payment request using evidence-first checks.',
};

const CONTEXTS: InputContext[] = ['generic', 'bank_scam', 'job_offer', 'invoice', 'proposal', 'website'];

export default async function CheckPage({ searchParams }: { searchParams: Promise<{ context?: string }> }) {
  const params = await searchParams;
  const defaultContext = CONTEXTS.includes(params.context as InputContext) ? params.context as InputContext : 'bank_scam';
  return (
    <Shell>
      <div className="page">
        <header className="page-head">
          <span className="chip chip-accent">Investigation</span>
          <h1>Is this safe to act on?</h1>
          <p className="lede">
            Choose what you received and paste the original content. TrustLens shows the warning signs,
            exact evidence, checks performed, what remains unknown and the next safe step.
          </p>
        </header>
        <CheckWorkspace defaultContext={defaultContext} />
      </div>
    </Shell>
  );
}
