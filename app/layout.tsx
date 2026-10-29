import type { Metadata, Viewport } from 'next';
import './globals.css';
import './global-controls.css';
import { GlobalControls } from '@/components/GlobalControls';

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
 * Restores the saved theme before first paint. The global toggle updates this
 * same data attribute and localStorage key on every route.
 */
const THEME_BOOTSTRAP = `try{var t=localStorage.getItem('trustlens.theme');document.documentElement.dataset.theme=(t==='light'||t==='dark')?t:'dark'}catch(e){document.documentElement.dataset.theme='dark'}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>
        <div id="app-root">
          <GlobalControls />
          {children}
        </div>
      </body>
    </html>
  );
}
