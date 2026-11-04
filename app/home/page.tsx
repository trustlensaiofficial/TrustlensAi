import Link from 'next/link';
import { Shell } from '@/components/ui/Shell';
import { Kaval } from '@/components/ui/Kaval';
import { CapabilityStrip } from '@/components/ui/CapabilityStrip';
import { RecentActivity } from '@/components/ui/RecentActivity';
import { demoCampaigns } from '@/lib/threat-intel/demo-network';
import {
  Alert, Arrow, Check, Globe, Lens, Lock, Phone, Shield, Users,
} from '@/components/ui/icons';

/** The one thing most people need, and the one thing they need in a crisis. */
export default function Dashboard() {
  const campaigns = demoCampaigns();
  const corroborated = campaigns.filter((c) => c.status === 'corroborated');

  return (
    <Shell>
      <div className="page">
        {/* Hero: what it is, and the single action. */}
        <section className="hero">
          <span className="chip chip-accent rise"><Shield /> Personal financial threat protection</span>
          <h1 className="hero-title rise" style={{ '--d': '70ms' } as React.CSSProperties}>
            Pause. Verify.<br />Then act.
          </h1>
          <p className="lede hero-lede rise" style={{ '--d': '140ms' } as React.CSSProperties}>
            Paste a suspicious message. We show you the exact words that are wrong, and the one
            safe thing to do next.
          </p>
          <div className="hero-actions rise" style={{ '--d': '210ms' } as React.CSSProperties}>
            <Link href="/check" className="btn btn-primary btn-lg"><Lens /> Check a message</Link>
            <Link href="/respond" className="btn btn-danger btn-lg"><Alert /> Something already happened</Link>
          </div>
          <div className="rise" style={{ '--d': '280ms' } as React.CSSProperties}>
            <CapabilityStrip />
          </div>
        </section>

        {/* Recent checks from this device. */}
        <section className="section">
          <div className="section-head section-head-split">
            <div>
              <h2>Your recent checks</h2>
              <p>Kept on this device. They open with no network and need no account.</p>
            </div>
            <Link href="/activity" className="btn btn-ghost btn-sm">See all <Arrow /></Link>
          </div>
          <RecentActivity />
        </section>

        {/* Campaigns in circulation. */}
        <section className="section">
          <div className="section-head section-head-split">
            <div>
              <h2>Doing the rounds right now</h2>
              <p>Campaigns several people reported independently. Simulated data.</p>
            </div>
            <Link href="/alerts" className="btn btn-ghost btn-sm">All campaigns <Arrow /></Link>
          </div>
          <ul className="grid grid-2 camp-grid">
            {(corroborated.length > 0 ? corroborated : campaigns).slice(0, 2).map((c, i) => (
              <li key={c.id} className="card card-pad camp rise" style={{ '--d': `${i * 60}ms` } as React.CSSProperties}>
                <div className="camp-top">
                  <span className="chip chip-high"><Users /> {c.corroboration} independent reporters</span>
                  <span className="chip">Simulated</span>
                </div>
                <h3 className="camp-title">{c.title}</h3>
                <div className="camp-inds">
                  {c.indicators.slice(0, 3).map((ind) => (
                    <span key={`${ind.kind}:${ind.value}`} className="camp-ind"><code>{ind.label}</code></span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* What makes it different — stated plainly, each linking somewhere real. */}
        <section className="section">
          <div className="section-head"><h2>What TrustLens actually does</h2></div>
          <ul className="grid grid-3 pillars">
            <li className="card card-pad"><span className="pillar-icon"><Lens /></span><h3>Shows its working</h3><p>Every warning quotes the exact words that triggered it, so you can judge the reasoning rather than trust a colour.</p></li>
            <li className="card card-pad"><span className="pillar-icon"><Check /></span><h3>Says what it could not check</h3><p>A check that did not run is never reported as a check that passed. No warning is not the same as safe.</p></li>
            <li className="card card-pad"><span className="pillar-icon"><Users /></span><h3>Recognises campaigns</h3><p>The same scam reaches many people with small edits. Matching the parts that cannot change links them together.</p></li>
            <li className="card card-pad"><span className="pillar-icon"><Phone /></span><h3>Helps after the fact</h3><p>If money already moved, it leads with 1930 and your bank&rsquo;s own number — not a lecture about being careful.</p></li>
            <li className="card card-pad"><span className="pillar-icon"><Lock /></span><h3>Keeps your messages yours</h3><p>Checks are kept on your device. Nothing is shared with the campaign network unless you choose to.</p></li>
            <li className="card card-pad"><span className="pillar-icon"><Globe /></span><h3>Works without internet</h3><p>Rules and link structure run locally. You are told which checks are paused rather than shown a stale result.</p></li>
          </ul>
        </section>

        {/* The crisis path, repeated at the bottom where someone scrolling in a
            panic will actually find it. */}
        <section className="section">
          <div className="card card-pad cta-card emergency-cta">
            <div>
              <h2><Phone /> Already sent money?</h2>
              <p className="lede">Call <strong>1930</strong> now — India&rsquo;s cyber-financial fraud helpline. The first hours are what decide whether a transfer can be frozen.</p>
            </div>
            <div className="hero-actions">
              <a className="btn btn-lg emergency-call" href="tel:1930"><Phone /> Call 1930</a>
              <Link href="/respond" className="btn btn-secondary btn-lg">What to do next <Arrow /></Link>
            </div>
          </div>
        </section>
      </div>
      <Kaval />
    </Shell>
  );
}
