import { redirect } from 'next/navigation';

/**
 * TrustLens is now a decision-support product, not a cinematic prototype.
 * The investigation workspace is the primary entry point; the guided story
 * remains available from /story for presentations and onboarding.
 */
export default function HomePage() {
  redirect('/analyze');
}
