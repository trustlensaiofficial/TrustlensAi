import { NextResponse } from 'next/server';
import { z } from 'zod';
import { addArtifact } from '@/lib/cases/store';
import { readJson, requireOwner, respond } from '@/lib/api/cases-shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ caseId: string }> };

const Body = z.object({
  type: z.enum(['message', 'url', 'screenshot', 'qr', 'email', 'sender_info', 'note']),
  // 8000 matches the CHECK constraint on the column and the contract.
  text: z.string().max(8_000).optional(),
  url: z.string().url().max(2_048).optional(),
  storageObjectPath: z.string().max(512).optional(),
  /**
   * The name the messaging app displayed. Stored as `user_supplied` and never
   * treated as identity — it is chosen by whoever sent the message.
   */
  senderLabel: z.string().max(200).optional(),
});

export async function POST(request: Request, { params }: Params) {
  const owner = await requireOwner(request, 'cases-write');
  if (!owner.ok) return owner.response;

  const body = await readJson(request);
  if (!body.ok) return body.response;

  const parsed = Body.safeParse(body.value);
  if (!parsed.success) {
    return NextResponse.json({ error: 'The artifact did not match the expected shape.' }, { status: 400 });
  }

  // An artifact with nothing in it is a row with no evidence in it.
  const { type, text, url, storageObjectPath } = parsed.data;
  if (!text && !url && !storageObjectPath) {
    return NextResponse.json(
      { error: 'An artifact needs text, a url, or a stored object path.' },
      { status: 400 },
    );
  }
  if (type === 'url' && !url) {
    return NextResponse.json({ error: 'A url artifact needs a url.' }, { status: 400 });
  }

  const { caseId } = await params;
  return respond(await addArtifact(owner.userId, caseId, parsed.data), 'artifact', 201);
}
