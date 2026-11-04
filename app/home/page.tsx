import Link from 'next/link';
import { Shell } from '@/components/ui/Shell';
import { InstallApp } from '@/components/ui/InstallApp';
import { Kaval } from '@/components/ui/Kaval';
import { RecentActivity } from '@/components/ui/RecentActivity';
import { Alert, Arrow, Check, Globe, Lens, Lock, Phone, Shield, Users } from '@/components/ui/icons';
import './dashboard.css';

/** A focused protection dashboard. Every card leads to a real product route. */
const TOOLS = [
  { href: '/check', label: 'Check a message', detail: 'Inspect suspicious texts, links and payment requests.', action: 'Start a check', icon: <Lens />, tone: 'cyan' },
  { href: '/respond', label: 'Get help now', detail: 'Follow practical steps if you clicked, shared details or paid.', action: 'Open response guide', icon: <Alert />, tone: 'rose' },
  { href: '/alerts', label: 'Scam intelligence', detail: 'Explore reported patterns and example campaigns.', action: 'View intelligence', icon: <Users />, tone: 'violet' },
  { href: '/activity', label: 'Your check history', detail: 'Return to reports saved on this device.', action: 'View activity', icon: <Check />, tone: 'blue' },
  { href: '/privacy', label: 'Privacy controls', detail: 'Understand what stays on your device and what you choose to share.', action: 'Review privacy', icon: <Lock />, tone: 'mint' },
  { href: '/story', label: 'How TrustLens works', detail: 'See how evidence, rules and AI interpretation are separated.', action: 'Explore the method', icon: <Globe />, tone: 'amber' },
];

export default function Dashboard() {
  return (
    <Shell>
      <div className="dashboard">
        <section className="dash-welcome">
          <div className="dash-welcome-copy">
            <span className="dash-eyebrow"><span className="dash-live-dot" /> YOUR PROTECTION SPACE</span>
            <h1>Make your next move<br /><span>with confidence.</span></h1>
            <p>Check before you click, pay or share. TrustLens explains the evidence and gives you a clear next step.</p>
            <div className="dash-primary-actions">
              <Link href="/check" className="dash-primary"><Lens /> Check something now <Arrow /></Link>
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
            <div><span className="dash-eyebrow">YOUR TOOLS</span><h2 id="dash-tools-title">What do you need to do?</h2></div>
            <span className="dash-section-note">Choose a tool to get started</span>
          </div>
          <div className="dash-tools-grid">
            {TOOLS.map((tool, index) => (
              <Link key={tool.href} href={tool.href} className={`dash-tool-card dash-${tool.tone}`} style={{ '--card-index': index } as React.CSSProperties}>
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
            <p>Contact your bank immediately and call the national cyber-fraud helpline.</p>
            <a href="tel:1930" className="dash-emergency-number">1930 <span>Call helpline <Arrow /></span></a>
            <Link href="/respond" className="dash-text-link">See the next steps <Arrow /></Link>
          </aside>
        </section>

        <section className="dash-install-section"><InstallApp /></section>
        <p className="dash-trust-note"><Shield /> Evidence-first analysis. A result is not a guarantee that a person, website or request is genuine.</p>
      </div>
      <Kaval />
    </Shell>
  );
}
