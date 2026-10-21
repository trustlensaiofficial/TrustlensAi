import { generateText } from "ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are TrustLens AI, an evidence-first trust and source-analysis assistant.
Separate claims, evidence, and conclusions. State uncertainty clearly. Never claim to have browsed, verified a source, or checked live facts unless that evidence is actually provided in the conversation. When evidence is missing, ask for it or explain what would be needed. Do not present a trust score as objective fact without a transparent, stated methodology.`;

export async function POST(request) {
  if (!process.env.AI_GATEWAY_API_KEY) {
    return NextResponse.json(
      { error: "AI Gateway is not configured. Add AI_GATEWAY_API_KEY to the server environment." },
      { status: 503 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json({ error: "A non-empty prompt is required." }, { status: 400 });
  }
  if (prompt.length > 8000) {
    return NextResponse.json({ error: "Prompt must be 8,000 characters or fewer." }, { status: 413 });
  }

  try {
    const result = await generateText({
      model: "anthropic/claude-sonnet-4.5",
      system: SYSTEM_PROMPT,
      prompt,
      maxOutputTokens: 700,
      temperature: 0.2,
    });

    return NextResponse.json({ text: result.text });
  } catch (error) {
    console.error("TrustLens AI Gateway request failed:", error);
    return NextResponse.json(
      { error: "The AI request could not be completed. Check AI Gateway configuration and usage limits." },
      { status: 502 },
    );
  }
}
