import type { Metadata } from 'next';

/**
 * Root layout.
 *
 * Kept deliberately bare. The UI layer was removed so the product could be
 * rebuilt on top of the existing engine, and this file is the one piece the
 * App Router requires even when the app serves only API routes. It carries
 * no stylesheet, no chrome and no theme bootstrap — whatever comes next owns
 * all of that.
 */
export const metadata: Metadata = {
  title: {
    default: 'TrustLens AI',
    template: '%s · TrustLens AI',
  },
  description:
    'Analyse a message, link or claim for warning signs, see the evidence behind each finding, understand what could not be verified, and get concrete steps to check it safely.',
  applicationName: 'TrustLens AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
