import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'TrustLens AI — verify before you act',
    template: '%s · TrustLens AI',
  },
  description:
    'Analyse a message, link or claim for warning signs, see the evidence behind each finding, understand what could not be verified, and get concrete steps to check it safely.',
  applicationName: 'TrustLens AI',
  openGraph: {
    title: 'TrustLens AI — verify before you act',
    description:
      'Evidence-first analysis of messages, links and claims, with every finding labelled by how it was established.',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f7f9' },
    { media: '(prefers-color-scheme: dark)', color: '#070910' },
  ],
};

/**
 * Restores the saved theme before first paint, so there is no flash of the
 * wrong appearance. Kept as a tiny inline script because any React-based
 * approach necessarily runs after hydration.
 *
 * With nothing saved the app opens dark: the cinematic flow is dark by
 * design, and following the OS instead would mean the product changed
 * appearance halfway through its own introduction. The light theme is still
 * one click away and is remembered once chosen.
 */
const THEME_BOOTSTRAP = `try{var t=localStorage.getItem('trustlens.theme');document.documentElement.dataset.theme=(t==='light'||t==='dark')?t:'dark'}catch(e){document.documentElement.dataset.theme='dark'}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>
        <div id="app-root">{children}</div>
      </body>
    </html>
  );
}
