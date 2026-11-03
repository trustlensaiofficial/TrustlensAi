import type { Metadata } from 'next';
import Link from 'next/link';
import { Shell } from '@/components/ui/Shell';
import { demoCampaigns } from '@/lib/threat-intel/demo-network';
import { CORROBORATION_THRESHOLD, STALE_AFTER_DAYS, type Campaign } from '@/lib/threat-intel/campaigns';
import { Alert, Arrow, Check, Clock, Globe, Help, Lens, Lock, Phone, Users } from '@/components/ui/icons';

export const metadata: Metadata = {
  title: 'Scam alerts',
  description:
    'Scam campaigns recognised across multiple independent reports, grouped by the indicators they share.',
};

const STATUS = {
  corroborated: { chip: 'chip-high', label: 'Corroborated', icon: <Users /> },
  preliminary: { chip: 'chip-check', label: 'Preliminary', icon: <Help /> },
  stale: { chip: '', label: 'Stale', icon: <Clock /> },
} as const;

const KIND_ICON = { domain: <Globe />, phone: <Phone />, upi: <Arrow />, template: <Lens /> } as const;

function when(iso: string): string {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return `${Math.round(days / 30)} months ago`;
}

function CampaignCard({ campaign, index }: { campaign: Campaign; index: number }) {
  const status = STATUS[campaign.status];
  return (
    <li
      className={`card card-pad camp camp-${campaign.status} rise`}
      style={{ '--d': `${index * 60}ms` } as React.CSSProperties}
    >
      <div className="camp-top">
        <span className={`chip ${status.chip}`}>{status.icon} {status.label}</span>
        <span className="chip">Simulated</span>
      </div>

      <h3 className="camp-title">{campaign.title}</h3>
      <p className="camp-cat">{campaign.category}</p>

      {/* The corroboration count is computed from distinct reporters, so it
          means something. Repeat submissions by one person do not inflate it. */}
      <div className="camp-stat">
        <span className="camp-num">{campaign.corroboration}</span>
        <span className="camp-num-label">
          independent {campaign.corroboration === 1 ? 'reporter' : 'reporters'}
          <br />
          <span className="muted-xs">
            from {campaign.reportCount} {campaign.reportCount === 1 ? 'report' : 'reports'}
          </span>
        </span>
      </div>

      <div className="camp-inds">
        {campaign.indicators.slice(0, 5).map((ind) => (
          <span key={`${ind.kind}:${ind.value}`} className="camp-ind">
            {KIND_ICON[ind.kind]}
            <code>{ind.label}</code>
          </span>
        ))}
      </div>

      <p className="camp-seen">
        <Clock /> First seen {when(campaign.firstSeen)} · last seen {when(campaign.lastSeen)}
      </p>

      {campaign.status === 'preliminary' && (
        <p className="camp-caveat">
          Not yet corroborated. Fewer than {CORROBORATION_THRESHOLD} independent reporters, so this
          is shown for awareness and is never pushed as an alert.
        </p>
      )}
      {campaign.status === 'stale' && (
        <p className="camp-caveat">
          Nothing new for over {STALE_AFTER_DAYS} days. A number can be reassigned, so an old
          indicator should not keep accusing whoever holds it now.
        </p>
      )}
    </li>
  );
}

export default function AlertsPage() {
  const campaigns = demoCampaigns();
  const corroborated = campaigns.filter((c) => c.status === 'corroborated').length;

  return (
    <Shell>
      <div className="page">
        <header className="page-head">
          <span className="chip chip-accent"><Users /> Community intelligence</span>
          <h1>Scam campaigns in circulation</h1>
          <p className="lede">
            One person reporting one number proves nothing. When several people independently
            report messages that share a link, a number or a payment handle, that is a campaign —
            and it can warn the next person before they lose anything.
          </p>
        </header>

        {/* Said once, clearly, at the top — not buried in a footnote. */}
        <p className="notice notice-check" role="note">
          <Alert />
          <span>
            <strong>Everything on this page is simulated.</strong> No TrustLens user submitted any
            of it. The reports are invented to demonstrate the matching, but they run through the
            same grouping code as live input — the clusters, the counts and the staleness below
            are genuinely computed, not written by hand.
          </span>
        </p>

        <section className="section">
          <div className="section-head">
            <h2>{campaigns.length} campaigns · {corroborated} corroborated</h2>
            <p>Ordered by how many independent people reported them.</p>
          </div>
          <ul className="grid grid-2 camp-grid">
            {campaigns.map((c, i) => <CampaignCard key={c.id} campaign={c} index={i} />)}
          </ul>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>How a campaign is built</h2>
            <p>The rules are fixed and stated, so an alert can show its working.</p>
          </div>
          <ol className="grid grid-2 how-grid">
            <li className="card card-pad"><h3><Lock /> Nothing leaves your device by default</h3><p>Your message text is never uploaded. Only normalised indicators — a domain, a keyed token standing in for a number, a payment handle, a wording signature — are ever eligible to be shared, and only if you opt in.</p></li>
            <li className="card card-pad"><h3><Lens /> Variants are matched, not exact strings</h3><p>Subdomains collapse to the registrable domain, numbers normalise to the subscriber, and wording reduces to a weighted signature — so a reworded resend still lands in the same campaign.</p></li>
            <li className="card card-pad"><h3><Users /> One voice is not consensus</h3><p>Corroboration counts distinct reporters, not reports. Submitting the same thing twelve times still counts as one, which is what stops a single actor manufacturing agreement.</p></li>
            <li className="card card-pad"><h3><Clock /> Indicators expire</h3><p>A campaign with nothing new for {STALE_AFTER_DAYS} days goes stale. Phone numbers get reassigned, and an indicator should not accuse someone forever.</p></li>
          </ol>
        </section>

        <section className="section">
          <div className="card card-pad cta-card">
            <div>
              <h2>Got a message like one of these?</h2>
              <p className="lede">Check it before you act. You will see the evidence and the next safe step.</p>
            </div>
            <Link href="/check" className="btn btn-primary btn-lg"><Lens /> Check a message</Link>
          </div>
        </section>

        <p className="report-foot">
          <Check />
          Production would hold the indicator key in a managed service, rotate it, and use a
          privacy-preserving set-intersection protocol so matching never requires the server to
          see a candidate indicator at all. That is the documented next step, not something built.
        </p>
      </div>
    </Shell>
  );
}
