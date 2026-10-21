"use client";

import { useState } from "react";

export default function AiTestPage() {
  const [prompt, setPrompt] = useState("Analyze this claim: 'A viral post says a new study proves coffee prevents all heart disease.' What evidence would be needed to assess it?");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setAnswer("");
    setError("");
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The request failed.");
      setAnswer(data.text || "Claude returned an empty response.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px", color: "var(--foreground, #e8eaf0)" }}>
      <a href="/" style={{ color: "var(--accent, #8b9cff)" }}>← Back to TrustLens AI</a>
      <p style={{ marginTop: 32, textTransform: "uppercase", letterSpacing: ".12em", fontSize: 12, opacity: .7 }}>Developer preview</p>
      <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", margin: "12px 0" }}>Test Claude with TrustLens AI</h1>
      <p style={{ lineHeight: 1.65, opacity: .8 }}>This page sends your prompt to the server-side /api/ai route through Vercel AI Gateway. The gateway key is never sent to the browser.</p>
      <form onSubmit={submit} style={{ marginTop: 28 }}>
        <label htmlFor="prompt" style={{ display: "block", marginBottom: 10, fontWeight: 600 }}>Claim or question</label>
        <textarea id="prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={8000} required rows={7} style={{ width: "100%", boxSizing: "border-box", padding: 16, borderRadius: 12, border: "1px solid #41465a", background: "#111521", color: "inherit", font: "inherit", lineHeight: 1.6 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 14 }}>
          <button type="submit" disabled={loading || !prompt.trim()} style={{ padding: "12px 18px", border: 0, borderRadius: 10, cursor: loading ? "wait" : "pointer", fontWeight: 650, background: "var(--accent, #8b9cff)", color: "#111521" }}>{loading ? "Asking Claude…" : "Analyze with Claude"}</button>
          <span style={{ fontSize: 12, opacity: .65 }}>{prompt.length}/8000 characters</span>
        </div>
      </form>
      {error && <section role="alert" style={{ marginTop: 24, padding: 16, borderRadius: 12, border: "1px solid #a74c5c", background: "#321b25", lineHeight: 1.6 }}>{error}</section>}
      {answer && <section aria-live="polite" style={{ marginTop: 28, padding: 22, borderRadius: 14, border: "1px solid #41465a", background: "#111521" }}><h2 style={{ marginTop: 0 }}>Claude’s analysis</h2><div style={{ whiteSpace: "pre-wrap", lineHeight: 1.75 }}>{answer}</div></section>}
      <p style={{ marginTop: 28, fontSize: 12, opacity: .65, lineHeight: 1.6 }}>Preview only. Add authentication, per-user rate limits, and usage controls before exposing this endpoint publicly.</p>
    </main>
  );
}
