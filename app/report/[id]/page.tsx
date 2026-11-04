import type { Metadata } from 'next';
import Link from 'next/link';
import { Shell } from '@/components/ui/Shell';
import { StoredReportView } from '@/components/ui/StoredReportView';
import { Arrow } from '@/components/ui/icons';

export const metadata: Metadata = { title: 'Report', robots: { index: false, follow: false } };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Shell>
      <div className="page">
        <Link href="/activity" className="btn btn-ghost btn-sm back-link">
          <Arrow style={{ transform: 'rotate(180deg)' }} /> All checks
        </Link>
        <StoredReportView id={id} />
      </div>
    </Shell>
  );
}
