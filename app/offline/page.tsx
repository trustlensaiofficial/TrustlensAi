import type { Metadata } from 'next';
import Link from 'next/link';
import { Shell } from '@/components/ui/Shell';
import { Alert, Check, Close, Lens, Phone, WifiOff } from '@/components/ui/icons';

export const metadata: Metadata = { title: 'Offline', robots: { index: false, follow: false } };

/**
 * Shown when a page is requested with no network and nothing cached.
 *
 * It states exactly what still works rather than apologising, because the
 * emergency guidance below is the thing someone offline may actually need.
 */
export default function OfflinePage() {
  return (
    <Shell>
      <div className="page">
        <header className="page-head">
          <span className="chip chip-check"><WifiOff /> No connection</span>
          <h1>You are offline</h1>
          <p className="lede">
            That page has not been opened on this device yet, so there is no copy stored. Plenty
            still works without a connection.
          </p>
        </header>

        <div className="grid grid-2">
          <div className="card card-pad">
            <h3 className="col-head"><Check /> Works right now</h3>
            <ul className="tick-list">
              <li>Every report you have already run — they are stored on this device.</li>
              <li>The incident-response guidance, including the 1930 helpline.</li>
              <li>Moving around the app and reading anything already opened.</li>
            </ul>
          </div>
          <div className="card card-pad">
            <h3 className="col-head"><Close /> Needs a connection</h3>
            <ul className="tick-list tick-never">
              <li>Running a new check — the rules run on the server.</li>
              <li>Opening a link to see where it really goes.</li>
              <li>The AI reading layer and the campaign network.</li>
            </ul>
          </div>
        </div>

        <section className="section">
          <div className="card card-pad cta-card emergency-cta">
            <div>
              <h2><Phone /> If money has already gone</h2>
              <p className="lede">
                You do not need internet for this. Call <strong>1930</strong> — India&rsquo;s cyber
                -financial fraud helpline — then your bank, on the number printed on your card.
              </p>
            </div>
            <div className="hero-actions">
              <a className="btn btn-lg emergency-call" href="tel:1930"><Phone /> Call 1930</a>
              <Link href="/respond" className="btn btn-secondary btn-lg">What to do next</Link>
            </div>
          </div>
        </section>

        <p className="notice" style={{ marginTop: 'var(--s5)' }}>
          <Alert />
          <span>
            We will not show you a cached analysis and call it current. A check that could not run
            is reported as a check that did not run.
          </span>
        </p>

        <div className="hero-actions" style={{ marginTop: 'var(--s5)' }}>
          <Link href="/activity" className="btn btn-primary"><Lens /> Open your saved checks</Link>
        </div>
      </div>
    </Shell>
  );
}
