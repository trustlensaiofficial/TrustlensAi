import { NextResponse } from 'next/server';
import { getCase, recordEvent } from '@/lib/cases/store';
import { recoveryPlanFor } from '@/lib/incident/recovery-plan';
import { requireOwner } from '@/lib/api/cases-shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ caseId: string }> };

/**
 * The plan for the furthest action this case has recorded.
 *
 * Generated from `furthest_action` rather than stored, so improving the
 * guidance improves every existing case instead of leaving old ones holding
 * stale advice. The timeline records that a plan was generated, which is what
 * makes it reconstructable later.
 *
 * `POST /api/v1/recovery-plan` is the unauthenticated equivalent for someone
 * who has no case and no account — see that route.
 */
export async function GET(request: Request, { params }: Params) {
  const owner = await requireOwner(request, 'cases-read');
  if (!owner.ok) return owner.response;

  const { caseId } = await params;
  const found = await getCase(owner.userId, caseId);
  if (!found.ok) return NextResponse.json({ error: found.reason }, { status: found.status });

  const action = found.value.furthestAction;
  if (!action) {
    return NextResponse.json(
      {
        recoveryPlan: null,
        // Not an error: a case where nothing was acted on correctly has no
        // recovery plan, and saying so is more useful than an empty object.
        note: 'No action has been reported on this case yet, so there is nothing to recover from. Report one by posting an actionState to this case’s events.',
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  // Best-effort: the plan is what the caller asked for, and a failed timeline
  // write must not withhold it from someone who may have just lost money.
  await recordEvent(owner.userId, caseId, {
    kind: 'recovery_plan_generated',
    detail: `Plan generated for ${action}.`,
  });

  return NextResponse.json(
    { recoveryPlan: recoveryPlanFor(action) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
