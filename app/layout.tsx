import type { Metadata, Viewport } from 'next';
import './globals.css';
import './polish.css';
import { RegisterSW } from '@/components/ui/RegisterSW';

export const metadata: Metadata = {
  title: { default: 'TrustLens AI — Pause. Verify. Then act.', template: '%s · TrustLens AI' },
  description:
    'Personal financial threat protection. Check a message, link or payment request for warning signs, see the evidence behind every finding, and get the right next step.',
  applicationName: 'TrustLens AI',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'TrustLens AI', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F8FD' },
    { media: '(prefers-color-scheme: dark)', color: '#060A12' },
  ],
};

/**
 * Stamps the saved appearance before first paint so there is no flash of the
 * wrong theme. Kept as a tiny inline script because any React approach
 * necessarily runs after hydration. Defaults to the OS preference.
 */
const THEME = `try{var t=localStorage.getItem('trustlens.theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME }} /></head>
      <body>
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
