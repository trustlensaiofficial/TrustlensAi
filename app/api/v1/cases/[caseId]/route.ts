import { NextResponse } from 'next/server';
import { z } from 'zod';
import { deleteCase, getCase, updateCase } from '@/lib/cases/store';
import { isCaseStatus } from '@/lib/cases/transitions';
import { readJson, requireOwner, respond } from '@/lib/api/cases-shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ caseId: string }> };

const PatchBody = z
  .object({
    title: z.string().max(200).optional(),
    status: z.string().max(40).optional(),
  })
  .refine((b) => b.title !== undefined || b.status !== undefined, {
    message: 'Provide a title or a status.',
  });

export async function GET(request: Request, { params }: Params) {
  const owner = await requireOwner(request, 'cases-read');
  if (!owner.ok) return owner.response;
  const { caseId } = await params;
  return respond(await getCase(owner.userId, caseId), 'case');
}

/**
 * The owner may set any status, including reopening one we marked resolved.
 *
 * Deliberate: automatic transitions never reach `resolved` or `closed`, so the
 * only way in or out of those is a person deciding. They are allowed to
 * disagree with us about whether their own case is finished.
 */
export async function PATCH(request: Request, { params }: Params) {
  const owner = await requireOwner(request, 'cases-write');
  if (!owner.ok) return owner.response;

  const body = await readJson(request);
  if (!body.ok) return body.response;

  const parsed = PatchBody.safeParse(body.value);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Provide a title or a status.' }, { status: 400 });
  }
  if (parsed.data.status !== undefined && !isCaseStatus(parsed.data.status)) {
    return NextResponse.json({ error: 'That is not a recognised case status.' }, { status: 400 });
  }

  const { caseId } = await params;
  return respond(
    await updateCase(owner.userId, caseId, {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.status !== undefined && isCaseStatus(parsed.data.status)
        ? { status: parsed.data.status }
        : {}),
    }),
    'case',
  );
}

export async function DELETE(request: Request, { params }: Params) {
  const owner = await requireOwner(request, 'cases-write');
  if (!owner.ok) return owner.response;

  const { caseId } = await params;
  const result = await deleteCase(owner.userId, caseId);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: result.status });

  // Artifacts and events cascade with it.
  return new Response(null, { status: 204 });
}
