import Link from 'next/link';
import { SiteFooter, SiteHeader } from '@/components/SiteHeader';
import { AlertIcon, ArrowIcon, ChecklistIcon, EvidenceIcon, ScalesIcon } from '@/components/icons';

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section className="hero">
          <p className="eyebrow">
            <span className="dot" />
            Evidence first · Verify before you act
          </p>
          <h1>Know what you are trusting, before you act on it.</h1>
          <p className="lede">
            Scams, impersonation and synthetic media have made it genuinely hard to judge whether a
            message deserves your trust. A red warning label does not help you decide. TrustLens AI
            shows you <strong>what looks wrong</strong>, <strong>what it actually checked</strong>,{' '}
            <strong>what it could not verify</strong>, and <strong>what to do next</strong>.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/analyze">
              Analyze something <ArrowIcon />
            </Link>
            <Link className="btn btn-secondary" href="/analyze#examples">
              See example cases
            </Link>
          </div>
          <p className="hero-note">
            No sign-in required. Nothing here certifies content as genuine or fraudulent.
          </p>
        </section>

        <section className="pillars" aria-label="How TrustLens works">
          <article className="card pillar">
            <div className="pillar-icon"><AlertIcon /></div>
            <h3>Explainable warning signs</h3>
            <p>
              Fixed rules check for urgency, impersonation, credential requests, irreversible
              payment demands and lookalike domains — and each finding shows the exact words that
              triggered it, so you can judge the reasoning rather than trust a score.
            </p>
          </article>
          <article className="card pillar">
            <div className="pillar-icon"><EvidenceIcon /></div>
            <h3>An auditable evidence record</h3>
            <p>
              When a link is checked, you see what was actually retrieved and how. When something
              could not be established, that is recorded too. The tool never claims to have
              consulted a source it did not reach.
            </p>
          </article>
          <article className="card pillar">
            <div className="pillar-icon"><ScalesIcon /></div>
            <h3>Separated certainty</h3>
            <p>
              A rule match, a retrieved fact and a model interpretation are three different kinds
              of claim, and the report keeps them apart. You always know which parts are
              observation and which are inference.
            </p>
          </article>
        </section>

        <section className="card card-pad" aria-labelledby="workflow-title">
          <div className="section-head">
            <h2 id="workflow-title">
              <ChecklistIcon className="inline-icon" /> The verify-before-you-act workflow
            </h2>
            <p>Tailored to whatever you paste in</p>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.68, maxWidth: '72ch' }}>
            Most advice stops at &ldquo;be careful&rdquo;. Every report ends instead with specific
            steps you can take through a channel you already control — looking a number up on your
            own card rather than in the message, typing a domain yourself rather than following a
            link, or telling someone before you act when a message has demanded secrecy. That last
            pattern is the mechanism behind coercive &ldquo;digital arrest&rdquo; scams, and naming
            it is often what breaks the spell.
          </p>
          <div className="hero-actions" style={{ marginTop: 24 }}>
            <Link className="btn btn-primary" href="/analyze">
              Start an analysis <ArrowIcon />
            </Link>
          </div>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
