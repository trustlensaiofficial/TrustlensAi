import './globals.css';

export const metadata = {
  title: 'TrustLens AI | Trust intelligence workspace',
  description: 'A workspace for reviewing evidence, source quality, and trust signals.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
