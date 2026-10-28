import Link from 'next/link';
import { SiteFooter, SiteHeader } from '@/components/SiteHeader';
import { AlertIcon, ArrowIcon, ChecklistIcon, EvidenceIcon, ScalesIcon, ShieldIcon } from '@/components/icons';

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="shell home-shell">
        <section className="home-hero-grid">
          <div className="hero-copy">
            <p className="eyebrow"><span className="dot" /> Evidence first · Verify before you act</p>
            <h1>Trust less blindly.<br /><span className="hero-gradient">See the evidence.</span></h1>
            <p className="lede">
              A message says your account is blocked. An invoice changes at the last minute.
              A stranger asks you to act now. TrustLens helps you slow down, see the warning
              signs, and choose a safer next step.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary btn-premium" href="/analyze">
                Analyze a message <ArrowIcon />
              </Link>
              <Link className="btn btn-secondary btn-premium-secondary" href="/analyze#examples">
                Explore live demos
              </Link>
            </div>
            <div className="hero-trust-row">
              <span><ShieldIcon /> No sign-in required</span>
              <span><span className="trust-divider" /> Evidence before conclusions</span>
            </div>
          </div>

          <div className="hero-visual" aria-label="Illustrative TrustLens analysis report preview">
            <div className="visual-glow" />
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="report-window">
              <div className="window-topbar">
                <div className="window-dots"><i /><i /><i /></div>
                <span className="window-label">TRUSTLENS / REPORT PREVIEW</span>
                <span className="window-lock"><ShieldIcon /></span>
              </div>
              <div className="preview-content">
                <div className="preview-status-row">
                  <span className="preview-kicker"><span className="dot" /> EXAMPLE ANALYSIS</span>
                  <span className="preview-chip">Illustrative</span>
                </div>
                <h2 className="preview-title">Payment request needs a closer look.</h2>
                <p className="preview-copy">“Your account will be suspended today. Pay the verification fee immediately.”</p>
                <div className="preview-signal">
                  <div className="preview-signal-icon"><AlertIcon /></div>
                  <div className="preview-signal-copy">
                    <strong>Urgency + payment pressure</strong>
                    <span>Rule match · Triggering wording shown</span>
                  </div>
                  <span className="preview-signal-mark">!</span>
                </div>
                <div className="preview-evidence">
                  <div className="evidence-line"><span className="evidence-dot evidence-observed" /><span><strong>What was checked</strong><small>Specific wording and link structure</small></span><b>01</b></div>
                  <div className="evidence-line"><span className="evidence-dot evidence-unknown" /><span><strong>What remains unknown</strong><small>Whether the sender is genuine</small></span><b>02</b></div>
                </div>
                <div className="preview-next-step">
                  <span className="next-step-icon"><ChecklistIcon /></span>
                  <span><strong>Your next safe step</strong><small>Contact the organisation using a number you find independently.</small></span>
                  <ArrowIcon />
                </div>
              </div>
            </div>
            <div className="floating-note floating-note-top">
              <span className="floating-note-icon"><EvidenceIcon /></span>
              <span><strong>Evidence, not guesses</strong><small>Every check has a source</small></span>
            </div>
            <div className="floating-note floating-note-bottom">
              <span className="floating-note-icon floating-note-purple"><ScalesIcon /></span>
              <span><strong>Clear next steps</strong><small>Know what to do next</small></span>
            </div>
          </div>
        </section>

        <section className="home-principles" aria-label="The TrustLens approach">
          <div className="principle-heading">
            <p className="eyebrow"><span className="dot" /> A clearer way to decide</p>
            <h2>Not just a warning.<br /><span className="muted-heading">A reason you can inspect.</span></h2>
            <p>Trust is too important for a mysterious red badge. Each report separates what a rule found, what a link check actually observed, and what remains uncertain.</p>
          </div>
          <div className="principle-grid">
            <article className="card principle-card">
              <div className="principle-icon icon-mint"><AlertIcon /></div>
              <span className="principle-number">01 / DETECT</span>
              <h3>See the exact signal</h3>
              <p>Urgency, impersonation, credential requests and risky link patterns are tied to the exact wording or structure that triggered them.</p>
            </article>
            <article className="card principle-card">
              <div className="principle-icon icon-blue"><EvidenceIcon /></div>
              <span className="principle-number">02 / INSPECT</span>
              <h3>Know what was checked</h3>
              <p>Real observations are kept separate from failed checks and facts that could not be established. No pretend verification.</p>
            </article>
            <article className="card principle-card">
              <div className="principle-icon icon-violet"><ScalesIcon /></div>
              <span className="principle-number">03 / ACT</span>
              <h3>Choose a safer next step</h3>
              <p>Get a practical checklist: verify independently, use a channel you control, and pause before sharing money or credentials.</p>
            </article>
          </div>
        </section>

        <section className="home-cta-panel">
          <div className="cta-mark"><ShieldIcon /></div>
          <div className="cta-copy">
            <p className="eyebrow"><span className="dot" /> Your decision. Better evidence.</p>
            <h2>Before you click, pay, or reply.</h2>
            <p>Paste a message, link, or claim. TrustLens will show what it can establish—and what it cannot.</p>
          </div>
          <Link className="btn btn-primary btn-premium" href="/analyze">Start checking <ArrowIcon /></Link>
        </section>
        <p className="home-disclaimer">TrustLens identifies warning signs; it does not certify content as genuine or fraudulent. The absence of warning signs is not proof of safety.</p>
        <SiteFooter />
      </main>
    </>
  );
}
