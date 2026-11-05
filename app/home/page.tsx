import Link from 'next/link';
import { Shell } from '@/components/ui/Shell';
import { InstallApp } from '@/components/ui/InstallApp';
import { Kaval } from '@/components/ui/Kaval';
import { RecentActivity } from '@/components/ui/RecentActivity';
import { Alert, Arrow, Bell, Bolt, Check, Doc, Globe, Lens, Lock, Phone, Scales, Shield, Users } from '@/components/ui/icons';
import './dashboard.css';

/** Every destination below maps to a real route and a real workflow. */
const TOOLS = [
  { href: '/check?context=generic', label: 'Message check', detail: 'Inspect SMS, WhatsApp, email and chat text you choose to share.', action: 'Check a message', icon: <Lens />, tone: 'cyan', group: 'Investigate' },
  { href: '/check?context=website', label: 'Link & website check', detail: 'Review a suspicious URL and inspect available website signals.', action: 'Check a link', icon: <Globe />, tone: 'blue', group: 'Investigate' },
  { href: '/check?context=bank_scam', label: 'Bank & UPI protection', detail: 'Look for OTP, PIN, refund, payment and impersonation pressure.', action: 'Check a payment request', icon: <Phone />, tone: 'rose', group: 'Investigate' },
  { href: '/check?context=job_offer', label: 'Job offer check', detail: 'Review recruitment messages, fees, deposits and identity claims.', action: 'Review an offer', icon: <Users />, tone: 'violet', group: 'Investigate' },
  { href: '/check?context=invoice', label: 'Invoice & payment check', detail: 'Inspect bills, account-change requests and payment instructions.', action: 'Review an invoice', icon: <Doc />, tone: 'amber', group: 'Investigate' },
  { href: '/check?context=proposal', label: 'Investment claim check', detail: 'Examine return promises, deposits and high-pressure proposals.', action: 'Review a claim', icon: <Scales />, tone: 'mint', group: 'Investigate' },
  { href: '/respond', label: 'Scam incident response', detail: 'Get the right steps if you clicked, shared details or sent money.', action: 'Get help now', icon: <Alert />, tone: 'rose', group: 'Protect' },
  { href: '/activity', label: 'Reports & history', detail: 'Reopen checks saved on this device and manage report copies.', action: 'Open your reports', icon: <Check />, tone: 'blue', group: 'Protect' },
  { href: '/alerts', label: 'Scam intelligence', detail: 'Explore reported patterns and example scam campaigns.', action: 'View intelligence', icon: <Bell />, tone: 'violet', group: 'Learn' },
  { href: '/story', label: 'Safety guide', detail: 'Understand how TrustLens separates evidence, rules and AI.', action: 'Learn how it works', icon: <Bolt />, tone: 'amber', group: 'Learn' },
];

export default function Dashboard() {
  return (
    <Shell>
      <div className="dashboard">
        <section className="dash-welcome">
          <div className="dash-welcome-copy">
            <span className="dash-eyebrow"><span className="dash-live-dot" /> TRUSTLENS PROTECTION</span>
            <h1>Pause. Verify.<br /><span>Then act.</span></h1>
            <p>Check a message, link or payment request before you trust it. See the evidence, understand what is unknown and choose a safer next step.</p>
            <div className="dash-primary-actions">
              <Link href="/check" className="dash-primary"><Lens /> Start a check <Arrow /></Link>
              <Link href="/respond" className="dash-secondary"><Phone /> I need help</Link>
            </div>
          </div>
          <div className="dash-orb-scene" aria-hidden="true">
            <div className="dash-orb dash-orb-back" />
            <div className="dash-orb dash-orb-front"><Shield /></div>
            <span className="dash-orbit dash-orbit-one" />
            <span className="dash-orbit dash-orbit-two" />
            <span className="dash-orb-spark dash-spark-one" />
            <span className="dash-orb-spark dash-spark-two" />
          </div>
        </section>

        <section className="dash-tools-section" aria-labelledby="dash-tools-title">
          <div className="dash-section-heading">
            <div><span className="dash-eyebrow">YOUR PROTECTION TOOLS</span><h2 id="dash-tools-title">What would you like to check?</h2></div>
            <span className="dash-section-note">Each tool opens a real workflow</span>
          </div>
          <div className="dash-tools-grid">
            {TOOLS.map((tool, index) => (
              <Link key={tool.href} href={tool.href} className={`dash-tool-card dash-${tool.tone}`} style={{ '--card-index': index } as React.CSSProperties}>
                <span className="dash-tool-topline"><span>{tool.group}</span><span className="dash-tool-number">{String(index + 1).padStart(2, '0')}</span></span>
                <span className="dash-tool-icon">{tool.icon}</span>
                <span className="dash-tool-content"><strong>{tool.label}</strong><span>{tool.detail}</span></span>
                <span className="dash-tool-action">{tool.action}<Arrow /></span>
                <span className="dash-card-glow" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>

        <section className="dash-lower-grid">
          <div className="dash-history-panel">
            <div className="dash-section-heading">
              <div><span className="dash-eyebrow">RECENT ACTIVITY</span><h2>Your latest checks</h2></div>
              <Link href="/activity" className="dash-text-link">See all <Arrow /></Link>
            </div>
            <RecentActivity />
          </div>
          <aside className="dash-safety-card">
            <span className="dash-safety-icon"><Phone /></span>
            <span className="dash-eyebrow">URGENT HELP · INDIA</span>
            <h2>Already sent money?</h2>
            <p>Contact your bank immediately and call the national cyber-fraud helpline. Do not wait for an app report.</p>
            <a href="tel:1930" className="dash-emergency-number">1930 <span>Call helpline <Arrow /></span></a>
            <Link href="/respond" className="dash-text-link">See the next steps <Arrow /></Link>
          </aside>
        </section>

        <section className="dash-install-section"><InstallApp /></section>
        <p className="dash-trust-note"><Shield /> TrustLens analyses only what you choose to share. It does not silently read messages from other apps.</p>
      </div>
      <Kaval />
    </Shell>
  );
}
