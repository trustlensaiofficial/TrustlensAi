import { NextResponse } from 'next/server';
import { z } from 'zod';
import { describeFailure, resolveProvider } from '@/lib/analysis/llm';
import { kavalSystemPrompt, MAX_MESSAGE_CHARS, MAX_TURNS, type KavalTurn } from '@/lib/assistant/kaval';
import { checkRateLimit, clientKeyFromHeaders } from '@/lib/ratelimit';
import type { Report } from '@/lib/analysis/types';

export const dynamic = 'force-dynamic';

const Turn = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(MAX_MESSAGE_CHARS),
});

const Body = z.object({
  messages: z.array(Turn).min(1).max(MAX_TURNS),
  /** The report in view, so Kaval can answer about it. Optional. */
  report: z.unknown().optional(),
});

const TIMEOUT_MS = 20_000;
const GATEWAY_MODEL = 'anthropic/claude-sonnet-5';
const ANTHROPIC_MODEL = 'claude-sonnet-5';

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Kaval, the scoped assistant.
 *
 * The conversation is passed through verbatim and the system prompt carries
 * every constraint. Nothing from the user's turns is interpolated into the
 * system prompt, so a message cannot rewrite Kaval's instructions by
 * containing text that looks like one.
 */
export async function POST(request: Request) {
  const limit = checkRateLimit(`assistant:${clientKeyFromHeaders(request.headers)}`);
  if (!limit.allowed) {
    return fail('Too many messages just now. Wait a moment and try again.', 429);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return fail('That request could not be read.', 400);
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) return fail('That request was not in the expected shape.', 400);

  const provider = resolveProvider();
  if (provider === 'none') {
    return fail(
      'Kaval needs a connection to answer. The rules, your saved reports and the response guidance all still work without it.',
      503,
    );
  }

  const { messages, report } = parsed.data;
  const system = kavalSystemPrompt((report as Report | undefined) ?? null);

  try {
    const text =
      provider === 'vercel-ai-gateway'
        ? await viaGateway(system, messages)
        : await viaAnthropic(system, messages);

    const reply = text.trim();
    if (!reply) return fail('Kaval did not have an answer for that. Try rephrasing it.', 502);
    return NextResponse.json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/timeout|abort/i.test(message)) {
      return fail('Kaval took too long to answer. Try again, or ask something shorter.', 504);
    }
    // Same classifier the analyser uses: a billing refusal should not be
    // reported as a network problem, or nobody ever fixes the real cause.
    const reason = describeFailure(message)
      .replace(' The deterministic warning signs and evidence below are unaffected and were produced without the model.', '');
    return fail(`${reason} Everything else in TrustLens still works.`, 502);
  }
}

async function viaGateway(system: string, messages: KavalTurn[]): Promise<string> {
  const { generateText } = await import('ai');
  const result = await generateText({
    model: GATEWAY_MODEL,
    system,
    messages,
    maxOutputTokens: 900,
    temperature: 0.3,
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return result.text;
}

async function viaAnthropic(system: string, messages: KavalTurn[]): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 900, temperature: 0.3, system, messages }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`anthropic_http_${res.status}`);
  const data: unknown = await res.json();
  const blocks = (data as { content?: Array<{ type: string; text?: string }> }).content ?? [];
  return blocks.filter((b) => b.type === 'text').map((b) => b.text ?? '').join('');
}
