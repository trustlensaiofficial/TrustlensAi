import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './tailwind.css';
import { RegisterSW } from '@/components/ui/RegisterSW';
import { LocaleProvider } from '@/components/i18n/LocaleProvider';
import { getLocale } from '@/lib/i18n/server';
import { LOCALE_INFO } from '@/lib/i18n';

/**
 * Inter, self-hosted by Next at build time.
 *
 * The token stack has named Inter since the design system landed, but nothing
 * ever loaded it — so every surface was quietly rendering in system-ui and the
 * typography was never the one that was designed. Serving it through
 * `next/font` self-hosts the file, so there is no third-party request and no
 * flash of a fallback face.
 *
 * `display: swap` with an adjusted fallback keeps text visible during load and
 * holds the metrics close enough that the swap does not shift layout.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  // Only the weights the type scale actually uses.
  weight: ['400', '500', '600', '700'],
  adjustFontFallback: true,
});

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  /*
   * The locale is resolved before a byte is sent, so the server renders in
   * the right language and `lang` is correct on <html> from the first parse.
   * That attribute is not cosmetic: it decides which font the browser picks
   * for Devanagari and Telugu, how a screen reader pronounces the page, and
   * whether the text is offered for translation.
   */
  const locale = await getLocale();

  return (
    <html lang={LOCALE_INFO[locale].tag} className={inter.variable} suppressHydrationWarning>
      <body>
        {/*
          Runs before anything paints, so the saved theme is on <html> by the
          time the first rule is evaluated and there is no flash of the wrong
          one. It sits here rather than in <head> because React 19 does not
          execute a <script> rendered inside a component on the client, and
          warns about it — in the body it is part of the initial HTML, parsed
          and run in document order. It only has to stamp the attribute once.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME }} />
        <RegisterSW />
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
