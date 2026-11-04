import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCase, listCases } from '@/lib/cases/store';
import { readJson, requireOwner, respond } from '@/lib/api/cases-shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateBody = z.object({
  title: z.string().max(200).optional(),
  context: z.enum(['generic', 'bank_scam', 'job_offer', 'invoice', 'proposal', 'website']).optional(),
});

export async function POST(request: Request) {
  const owner = await requireOwner(request, 'cases-write');
  if (!owner.ok) return owner.response;

  const body = await readJson(request);
  if (!body.ok) return body.response;

  const parsed = CreateBody.safeParse(body.value);
  if (!parsed.success) {
    return NextResponse.json({ error: 'The request body did not match the expected shape.' }, { status: 400 });
  }

  return respond(await createCase(owner.userId, parsed.data), 'case', 201);
}

/** Cursor pagination, not offset — see the comment in lib/cases/store.ts. */
export async function GET(request: Request) {
  const owner = await requireOwner(request, 'cases-read');
  if (!owner.ok) return owner.response;

  const url = new URL(request.url);
  const limitRaw = url.searchParams.get('limit');
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
  if (limitRaw && (!Number.isFinite(limit) || limit! < 1)) {
    return NextResponse.json({ error: 'limit must be a positive integer.' }, { status: 400 });
  }

  const result = await listCases(owner.userId, {
    ...(limit !== undefined ? { limit } : {}),
    ...(url.searchParams.get('cursor') ? { cursor: url.searchParams.get('cursor')! } : {}),
  });
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: result.status });

  return NextResponse.json(result.value, { headers: { 'Cache-Control': 'no-store' } });
}
