import type { Metadata } from 'next';
import { Shell } from '@/components/ui/Shell';
import { Kaval } from '@/components/ui/Kaval';
import { RespondFlow } from '@/components/ui/RespondFlow';

export const metadata: Metadata = {
  title: 'I think I have been scammed',
  description:
    'Tell TrustLens what has already happened and get the right next steps, including the 1930 cyber-financial fraud helpline when money has moved.',
};

export default function RespondPage() {
  return (
    <Shell>
      <div className="page">
        <header className="page-head">
          <span className="chip chip-high">Incident response</span>
          <h1>Something already happened</h1>
          <p className="lede">
            The right move depends entirely on how far it went. Tell us what you have already done
            and we will give you that plan — not a general warning.
          </p>
        </header>
        <RespondFlow />
        <Kaval />
      </div>
    </Shell>
  );
}
