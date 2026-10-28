import { NextResponse } from 'next/server';
import { checkRateLimit, clientKeyFromHeaders } from '@/lib/ratelimit';
import { deleteReport, getReport } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Single-report access by unguessable id. There is intentionally no endpoint
 * that lists reports — see the access model in lib/store.ts.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { report, reason } = await getReport(id);
  if (!report) {
    return NextResponse.json({ error: reason ?? 'Report not found.' }, { status: 404 });
  }
  return NextResponse.json({ report }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const limit = checkRateLimit(`delete:${clientKeyFromHeaders(request.headers)}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${limit.retryAfterSeconds} seconds.` },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }
  const { id } = await context.params;
  const { deleted, reason } = await deleteReport(id);
  if (!deleted) {
    return NextResponse.json({ error: reason ?? 'The report could not be deleted.' }, { status: 400 });
  }
  return NextResponse.json({ deleted: true });
}
