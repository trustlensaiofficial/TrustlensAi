import type { Metadata } from 'next';
import Link from 'next/link';
import { Shell } from '@/components/ui/Shell';
import { EvidenceReport } from '@/components/ui/EvidenceReport';
import { Arrow } from '@/components/ui/icons';

export const metadata: Metadata = { title: 'Evidence summary', robots: { index: false, follow: false } };

export default async function EvidencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Shell>
      <div className="page">
        <Link href={`/report/${id}`} className="btn btn-ghost btn-sm back-link no-print">
          <Arrow style={{ transform: 'rotate(180deg)' }} /> Back to the report
        </Link>
        <header className="page-head no-print">
          <span className="chip chip-accent">Evidence summary</span>
          <h1>Prepare something you can hand over</h1>
          <p className="lede">
            A clean summary of what was found, for your bank or a cybercrime complaint. You choose
            what it includes.
          </p>
        </header>
        <EvidenceReport id={id} />
      </div>
    </Shell>
  );
}
