import type { Metadata } from 'next';
import Link from 'next/link';
import { Shell } from '@/components/ui/Shell';
import { StoredReportView } from '@/components/ui/StoredReportView';
import { Back } from '@/components/ui/icons';

export const metadata: Metadata = { title: 'Report', robots: { index: false, follow: false } };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Shell>
      <div className="screen">
        {/* Back to the list this report was opened from, not to the
            dashboard — the way out should undo the way in. */}
        <Link href="/activity" className="screen-back">
          <Back />
          <span>All checks</span>
        </Link>
        <StoredReportView id={id} />
      </div>
    </Shell>
  );
}
