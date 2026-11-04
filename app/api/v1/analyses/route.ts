import { handleAnalyses } from '@/lib/api/analyses';

export const runtime = 'nodejs';
export const maxDuration = 45;
/** Analysis depends on live network state, so never cache a response. */
export const dynamic = 'force-dynamic';

/**
 * The canonical analysis endpoint.
 *
 * Versioned because mobile clients cannot be shipped against a moving
 * contract: a breaking change to an unversioned path strands every installed
 * app. `/api/analyze` remains as a deprecated alias onto the same handler.
 */
export async function POST(request: Request) {
  return handleAnalyses(request);
}
