import type { ReactNode } from 'react';

import type { Metadata } from 'next';

import { Inter, Poppins } from 'next/font/google';

import { APP_DATA } from '@/constants/app-data.const';

import { cn } from '@/lib/utils';

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
  Static metadata is enough for now. The `metadataBase`, canonical link, OpenGraph card and the
  `ROBOTS_ENABLED` indexing gate are wired in step 2 once the SEO constants exist.
*/
export const metadata: Metadata = {
  title: APP_DATA.NAME,
  description: APP_DATA.DESCRIPTION,
  applicationName: APP_DATA.SHORT_NAME,
};

type RootLayoutProps = {
  children: ReactNode;
};

/*
  The root layout carries the document, nothing else. Page chrome belongs to the route groups —
  `(marketing)` gets the site header/footer, `(dashboard)` the sidebar, `(auth)` neither — all of which
  land in later steps.

  The font variables sit on `<html>`: `--font-body` resolves to `--font-inter` and `--font-display` to
  `--font-poppins` in `globals.css`, and a custom property resolves against the element that declares it,
  so the faces must be declared at the same level the tokens read them.
*/
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={cn(inter.variable, poppins.variable)}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
