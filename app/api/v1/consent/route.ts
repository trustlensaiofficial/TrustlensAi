import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  CONSENT_CAPABILITIES,
  currentConsent,
  isConsentCapability,
  recordConsent,
} from '@/lib/consent/store';
import { requireOwner } from '@/lib/api/cases-shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The disclosure wording currently in force.
 *
 * Bumping this invalidates existing grants: a receipt against an older
 * version comes back `stale: true` and the client must ask again. Consent to
 * wording someone never read is not consent.
 *
 * Kept in step with `ConsentStore.POLICY_VERSION` in the Android app.
 */
export const POLICY_VERSION = '2026-11-04';

const Body = z.object({
  capability: z.string().max(64),
  granted: z.boolean(),
  /**
   * Which wording the person saw. Optional, and defaulted to the current
   * version — a client that omits it is asserting it showed the current text,
   * which is the common case and the safe one, because a mismatch only ever
   * makes a grant stale rather than extending it.
   */
  policyVersion: z.string().max(64).optional(),
});

/** Records a grant or a revocation. Always an insert; never an edit. */
export async function POST(request: Request) {
  const owner = await requireOwner(request, 'consent-write');
  if (!owner.ok) return owner.response;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'The request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'A capability and a granted flag are required.' },
      { status: 400 },
    );
  }
  if (!isConsentCapability(parsed.data.capability)) {
    return NextResponse.json(
      { error: 'That is not a recognised capability.', validValues: [...CONSENT_CAPABILITIES] },
      { status: 400 },
    );
  }

  const result = await recordConsent(
    owner.userId,
    parsed.data.capability,
    parsed.data.granted,
    parsed.data.policyVersion ?? POLICY_VERSION,
  );
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: result.status });

  return NextResponse.json(
    { receipt: result.value },
    { status: 201, headers: { 'Cache-Control': 'no-store' } },
  );
}

/**
 * The current position for every capability.
 *
 * Every capability is listed, including ones never answered — those come back
 * `granted: false` with a null `decidedAt`, so a client can tell "declined"
 * from "never asked". Those need different interfaces.
 */
export async function GET(request: Request) {
  const owner = await requireOwner(request, 'consent-read');
  if (!owner.ok) return owner.response;

  const result = await currentConsent(owner.userId, POLICY_VERSION);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: result.status });

  return NextResponse.json(
    {
      ...result.value,
      note: 'Absent means not granted. Everything that sends data anywhere is off until the person turns it on, and each one is independent.',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
