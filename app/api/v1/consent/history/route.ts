import { NextResponse } from 'next/server';
import { consentHistory } from '@/lib/consent/store';
import { requireOwner } from '@/lib/api/cases-shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The full consent history, newest first.
 *
 * Append-only, so this is the whole record rather than a current state:
 * "turned this on in March and off in June" is a different fact from "this is
 * off", and a person asking for their data is entitled to the first one.
 */
export async function GET(request: Request) {
  const owner = await requireOwner(request, 'consent-read');
  if (!owner.ok) return owner.response;

  const result = await consentHistory(owner.userId);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: result.status });

  return NextResponse.json(
    { receipts: result.value },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
