import type { ReactNode } from 'react';

import type { Metadata, Viewport } from 'next';

import { Inter, Poppins } from 'next/font/google';

import { APP_DATA, SEO } from '@/constants';
import { env } from '@/env/server';

import { buildAbsoluteUrl, cn } from '@/lib/utils';

import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

/*
  Static rather than `generateMetadata`: with one language and no dynamic segment there is nothing to
  await. `metadataBase` is what makes the canonical link, the OG URL and the social card resolve as
  absolute instead of silently rendering relative. Indexing follows the same `ROBOTS_ENABLED` gate as
  `robots.txt`, so a deployment that has not opted in says `noindex` twice.
*/
export const metadata: Metadata = {
  metadataBase: new URL(env.APP_BASE_URL),
  title: APP_DATA.NAME,
  description: APP_DATA.DESCRIPTION,
  applicationName: APP_DATA.SHORT_NAME,
  keywords: [...SEO.KEYWORDS],
  authors: [{ name: APP_DATA.NAME }],
  alternates: {
    canonical: buildAbsoluteUrl(env.APP_BASE_URL),
  },
  openGraph: {
    type: 'website',
    siteName: APP_DATA.SHORT_NAME,
    url: buildAbsoluteUrl(env.APP_BASE_URL),
    title: APP_DATA.NAME,
    description: APP_DATA.DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_DATA.NAME,
    description: APP_DATA.DESCRIPTION,
  },
  robots: {
    index: env.ROBOTS_ENABLED,
    follow: env.ROBOTS_ENABLED,
  },
};

/*
  Browser-chrome color, matched to the app background in each scheme — the sRGB of `--background` light
  and dark, so a mobile address bar meets the page seamlessly.
*/
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7fbfc' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0e11' },
  ],
};

type RootLayoutProps = {
  children: ReactNode;
};

/*
  The root layout carries the document, nothing else. Page chrome belongs to the route groups —
  `(marketing)` gets the site header/footer, `(dashboard)` the sidebar, `(auth)` neither — all of which
  land in later steps.

  The font variables sit on `<html>`: `--font-body` resolves to `--font-inter` and `--font-display` to
  `--font-poppins` in `globals.css`, and a custom property resolves against the element that declares it.
*/
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={cn(inter.variable, poppins.variable)}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
