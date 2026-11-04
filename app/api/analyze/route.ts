import { handleAnalyses } from '@/lib/api/analyses';

export const runtime = 'nodejs';
export const maxDuration = 45;
export const dynamic = 'force-dynamic';

/**
 * Deprecated alias for `POST /api/v1/analyses`.
 *
 * Kept so the web client does not break mid-migration, and pointed at exactly
 * the same handler so the two cannot diverge. The response says it is
 * deprecated in headers rather than only in a document nobody reads: a client
 * author sees it in their own network tab.
 */
export async function POST(request: Request) {
  const response = await handleAnalyses(request);
  const headers = new Headers(response.headers);
  headers.set('Deprecation', 'true');
  headers.set('Link', '</api/v1/analyses>; rel="successor-version"');
  headers.set('X-TrustLens-Deprecated-Path', '/api/analyze');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
