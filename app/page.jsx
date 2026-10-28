"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase/client";

const EXAMPLE = "Your bank account will be blocked in 30 minutes. Verify your account immediately at http://secure-bank.example/login and share the OTP with our agent to avoid losing access.";

export default function Home() {
  const [input, setInput] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [signals, setSignals] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [authUser, setAuthUser] = useState(null);
  const [authMessage, setAuthMessage] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyBusy, setHistoryBusy] = useState(false);
  const supabase = useMemo(() => createClientSafe(), []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setAuthUser(data.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null);
      setAuthMessage(session?.user ? "Signed in. Your saved reviews are private to your account." : "");
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (authUser) loadHistory();
    else setHistory([]);
  }, [authUser]);

  function createClientSafe() {
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return null;
      return createClient();
    } catch { return null; }
  }

  async function loadHistory() {
    setHistoryBusy(true);
    try {
      const response = await fetch("/api/history");
      const data = await response.json();
      if (response.ok) setHistory(data.history || []);
    } catch { /* History is optional when offline. */ }
    finally { setHistoryBusy(false); }
  }

  async function submitAnalysis(event) {
    event.preventDefault();
    if (!input.trim() || busy) return;
    setBusy(true); setError(""); setAnalysis(""); setSignals([]);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis could not be completed.");
      setAnalysis(data.analysis);
      setSignals(data.signals || []);
      if (data.saved) loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally { setBusy(false); }
  }

  async function signIn(event) {
    event.preventDefault();
    if (!supabase) { setAuthMessage("Supabase is not configured in this deployment yet."); return; }
    setAuthBusy(true); setAuthMessage("");
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;
      setAuthMessage("Check your email for the secure sign-in link.");
    } catch (err) {
      setAuthMessage(err instanceof Error ? err.message : "Could not send sign-in link.");
    } finally { setAuthBusy(false); }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setAuthUser(null); setHistory([]);
  }

  const charCount = input.length;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="TrustLens AI home">
          <span className="brand-mark" aria-hidden="true">◈</span>
          <span>TrustLens <span className="brand-accent">AI</span></span>
        </a>
        <div className="topbar-right"><span className="live-dot" /> Evidence-first intelligence <span className="top-divider" /> <span className="top-muted">Private by design</span></div>
      </header>

      <section className="hero">
        <div className="eyebrow"><span className="eyebrow-line" /> TRUST, WITH EVIDENCE</div>
        <h1>Pause before you<br /><span className="headline-gradient">believe or act.</span></h1>
        <p className="hero-copy">Make sense of suspicious messages, urgent requests, and questionable claims. See warning signs, understand what is unknown, and choose a safer next step.</p>
        <div className="trust-points">
          <span><span className="check">✓</span> Clear warning signs</span>
          <span><span className="check">✓</span> Honest uncertainty</span>
          <span><span className="check">✓</span> Practical next steps</span>
        </div>
      </section>

      <section className="workspace">
        <div className="section-label"><span className="section-number">01</span><div><h2>Inspect a message or claim</h2><p>Paste the exact text you want to understand.</p></div></div>
        <form className="analysis-form" onSubmit={submitAnalysis}>
          <label htmlFor="message-input" className="field-label">MESSAGE, LINK, OR CLAIM</label>
          <textarea id="message-input" value={input} onChange={(event) => setInput(event.target.value)} maxLength={8000} rows={6} placeholder="Paste a message, offer, invoice request, suspicious link, or public claim…" required />
          <div className="input-footer"><button className="text-button" type="button" onClick={() => setInput(EXAMPLE)}>Try a sample <span>↗</span></button><span className={charCount > 7600 ? "char-count warn" : "char-count"}>{charCount.toLocaleString()}/8,000</span></div>
          <button className="primary-button" type="submit" disabled={busy || !input.trim()}><span>{busy ? "Reviewing signals…" : "Analyze with TrustLens"}</span><span className="button-arrow">{busy ? "◌" : "→"}</span></button>
          <p className="privacy-note"><span>◈</span> Your text is processed for this review. Avoid pasting passwords, OTPs, or sensitive personal information.</p>
        </form>
      </section>

      {(error || analysis) && <section className="results-section" aria-live="polite">
        <div className="section-label"><span className="section-number">02</span><div><h2>Review findings</h2><p>Signals are indicators, not proof of fraud or truth.</p></div></div>
        {error && <div className="error-panel" role="alert"><strong>Analysis unavailable</strong><p>{error}</p><button className="text-button" onClick={submitAnalysis}>Try again ↗</button></div>}
        {analysis && <div className="result-card">
          <div className="result-top"><div><span className="result-kicker">TRUSTLENS REVIEW</span><h3>What stands out</h3></div><span className="result-badge">{signals.length ? `${signals.length} signal${signals.length === 1 ? "" : "s"} found` : "Review complete"}</span></div>
          {signals.length > 0 && <div className="signals-list">{signals.map((signal, i) => <div className="signal-row" key={signal.id}><span className="signal-icon">{signal.severity === "high" ? "!" : "·"}</span><div><strong>{signal.title}</strong><p>{signal.detail}</p></div><span className={signal.severity === "high" ? "severity high" : "severity"}>{signal.severity === "high" ? "HIGH" : "CHECK"}</span></div>)}</div>}
          <div className="analysis-copy"><h4>AI-assisted interpretation</h4><p>{analysis}</p></div>
          <div className="result-disclaimer"><span>ⓘ</span><p>This review does not independently verify live websites or external claims. Confirm important details using an official channel you find independently.</p></div>
        </div>}
      </section>}

      <section className="account-section">
        <div className="section-label"><span className="section-number">03</span><div><h2>Your private review history</h2><p>Sign in to save and revisit your analyses across sessions.</p></div></div>
        <div className="account-card">
          {authUser ? <div className="signed-in"><div className="account-avatar">{(authUser.email || "U").slice(0,1).toUpperCase()}</div><div className="account-info"><strong>{authUser.email}</strong><span>Signed in · Private history enabled</span></div><button className="secondary-button" onClick={signOut}>Sign out</button></div> :
            <form className="signin-form" onSubmit={signIn}><div className="signin-copy"><strong>Save reviews securely</strong><span>Get a one-time sign-in link by email.</span></div><div className="signin-controls"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required aria-label="Email address" /><button className="secondary-button" type="submit" disabled={authBusy || !email.trim()}>{authBusy ? "Sending…" : "Email me a link"}</button></div></form>}
          {authMessage && <p className="auth-message" role="status">{authMessage}</p>}
          {authUser && <div className="history-list">{historyBusy ? <p className="empty-history">Loading saved reviews…</p> : history.length ? history.map((item) => <button className="history-item" key={item.id} onClick={() => { setInput(item.input_text); setAnalysis(item.analysis_text); setSignals([]); window.scrollTo({ top: 0, behavior: "smooth" }); }}><span>{item.input_text.slice(0, 110)}{item.input_text.length > 110 ? "…" : ""}</span><time>{new Date(item.created_at).toLocaleDateString()}</time></button>) : <p className="empty-history">Your saved reviews will appear here after your first analysis.</p>}</div>}
        </div>
      </section>

      <footer className="footer"><a className="footer-brand" href="/">TrustLens AI</a><span>Clarity before action.</span><span>AI-assisted · Evidence-led · Not a substitute for independent verification</span></footer>
    </main>
  );
}
