import type { Metadata } from 'next';
import Link from 'next/link';
import { ReportView } from '@/components/ReportView';
import { SiteFooter, SiteHeader } from '@/components/SiteHeader';
import { AlertIcon, ArrowIcon } from '@/components/icons';
import { getReport, storeStatus } from '@/lib/store';

export const metadata: Metadata = {
  title: 'Report',
  description: 'A saved TrustLens AI analysis report.',
  // A report echoes user-submitted content, so keep it out of search indexes.
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = storeStatus();
  const { report, reason } = await getReport(id);

  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section style={{ padding: 'clamp(26px, 4vw, 44px) 0 10px' }}>
          <Link className="btn btn-ghost" href="/analyze" style={{ paddingLeft: 0 }}>
            ← Back to the workspace
          </Link>
        </section>

        {report ? (
          <section style={{ paddingBottom: 10 }}>
            <ReportView report={report} />
          </section>
        ) : (
          <section className="card empty">
            <div className="empty-icon"><AlertIcon /></div>
            <h2>This report is not available</h2>
            <p>
              {store.enabled
                ? (reason ?? 'No report exists with that id.')
                : `Report storage is not configured on this deployment, so saved reports cannot be loaded. ${reason ?? ''}`}
            </p>
            <div className="hero-actions" style={{ justifyContent: 'center', marginTop: 24 }}>
              <Link className="btn btn-primary" href="/analyze">
                Run a new analysis <ArrowIcon />
              </Link>
            </div>
          </section>
        )}

        <SiteFooter />
      </main>
    </>
  );
}
