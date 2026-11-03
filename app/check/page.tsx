import type { Metadata } from 'next';
import { Shell } from '@/components/ui/Shell';
import { CheckWorkspace } from '@/components/ui/CheckWorkspace';

export const metadata: Metadata = {
  title: 'Check something',
  description:
    'Paste a message, link or payment request to see its warning signs, the exact words that triggered each one, what could not be checked, and what to do next.',
};

export default function CheckPage() {
  return (
    <Shell>
      <div className="page">
        <header className="page-head">
          <span className="chip chip-accent">Investigation</span>
          <h1>Is this safe to act on?</h1>
          <p className="lede">
            Paste the whole message so the wording can be examined. You will get the warning signs,
            the exact words behind each one, what we could not check, and the next safe step.
          </p>
        </header>
        <CheckWorkspace />
      </div>
    </Shell>
  );
}
