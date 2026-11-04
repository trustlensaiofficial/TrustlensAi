import { NextResponse } from 'next/server';
import { z } from 'zod';
import { recordEvent } from '@/lib/cases/store';
import { isCaseEventKind } from '@/lib/cases/transitions';
import { allActionStates, isUserActionState } from '@/lib/incident/recovery-plan';
import { readJson, requireOwner, respond } from '@/lib/api/cases-shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ caseId: string }> };

const Body = z.object({
  kind: z.string().max(40).optional(),
  actionState: z.string().max(64).optional(),
  detail: z.string().max(2_000).optional(),
});

/**
 * Appends to the case timeline, and moves the case to match.
 *
 * `actionState` alone is enough — reporting what you did is the common case, so
 * `kind` defaults to `action_reported`. The case's `furthest_action` only ever
 * moves toward more exposure: a milder answer given later never produces a
 * milder recovery plan (`lib/cases/transitions.ts`).
 */
export async function POST(request: Request, { params }: Params) {
  const owner = await requireOwner(request, 'cases-write');
  if (!owner.ok) return owner.response;

  const body = await readJson(request);
  if (!body.ok) return body.response;

  const parsed = Body.safeParse(body.value);
  if (!parsed.success) {
    return NextResponse.json({ error: 'The event did not match the expected shape.' }, { status: 400 });
  }

  const { actionState, detail } = parsed.data;
  const kind = parsed.data.kind ?? (actionState ? 'action_reported' : undefined);

  if (!kind || !isCaseEventKind(kind)) {
    return NextResponse.json({ error: 'That is not a recognised event kind.' }, { status: 400 });
  }
  if (actionState !== undefined && !isUserActionState(actionState)) {
    return NextResponse.json(
      { error: 'That is not a recognised action state.', validValues: allActionStates() },
      { status: 400 },
    );
  }

  const { caseId } = await params;
  return respond(
    await recordEvent(owner.userId, caseId, {
      kind,
      ...(actionState !== undefined && isUserActionState(actionState) ? { actionState } : {}),
      ...(detail !== undefined ? { detail } : {}),
    }),
    'result',
    201,
  );
}
