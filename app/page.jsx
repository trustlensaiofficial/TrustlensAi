const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export default function Home() {
  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="TrustLens AI home">
          <span className="brand-mark" aria-hidden="true">◈</span>
          <span>TrustLens <span style={{ color: 'var(--accent)' }}>AI</span></span>
        </a>
        <span className="top-meta">Trust intelligence workspace · Starter</span>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow">Evidence first. Trust by design.</div>
          <h1>See the signal.<br />Understand the source.</h1>
          <p className="lede">
            Your foundation for reviewing claims, checking source quality, and bringing
            important trust signals into one clear workspace.
          </p>
        </div>
        <aside className="status-card">
          <div className="status-label">Integration status</div>
          <div className="status-value"><span className="pip" />{supabaseConfigured ? 'Supabase configured' : 'Setup in progress'}</div>
          <div className="status-note">
            {supabaseConfigured
              ? 'The public project URL and publishable key are present in this deployment environment. A live data query has not been run yet.'
              : 'Add the Supabase URL and publishable key to the Vercel environment settings to enable the app connection.'}
          </div>
        </aside>
      </section>

      <section aria-labelledby="overview-title">
        <div className="section-heading">
          <h2 id="overview-title">Workspace overview</h2>
          <p>Starter layout · No production data touched</p>
        </div>
        <div className="grid">
          <article className="metric">
            <div className="metric-label">Evidence reviews</div>
            <div className="metric-value">Ready to build</div>
            <div className="metric-foot">Define your review workflow next</div>
          </article>
          <article className="metric">
            <div className="metric-label">Source verification</div>
            <div className="metric-value">Not connected</div>
            <div className="metric-foot">No external sources are queried yet</div>
          </article>
          <article className="metric">
            <div className="metric-label">Database</div>
            <div className="metric-value">{supabaseConfigured ? 'Configured' : 'Awaiting keys'}</div>
            <div className="metric-foot">Schema and row-level security still to be designed</div>
          </article>
        </div>
      </section>

      <section className="workspace-card">
        <div className="workspace-row">
          <div>
            <div className="workspace-title">Your foundation is in place</div>
            <p className="workspace-copy">
              This starter adds a Next.js app shell and reusable Supabase client helpers.
              Authentication, database tables, AI providers, and source-checking logic are
              intentionally left for the next reviewed step.
            </p>
          </div>
          <span className="pill">Starter workspace</span>
        </div>
      </section>

      <footer className="footer">
        <span>TrustLens AI</span>
        <span>Built for transparent, evidence-led decisions</span>
      </footer>
    </main>
  );
}
