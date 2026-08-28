import type { ReactNode } from 'react';

import type { Metadata } from 'next';

import './globals.css';

/*
  Static metadata is enough for step 0. The `metadataBase`, canonical link, OpenGraph card and the
  `ROBOTS_ENABLED` indexing gate are wired in step 2 once the typed env and constants exist.
*/
export const metadata: Metadata = {
  title: 'Vehicle Utilities Supply and Maintenance System',
  description: 'Centralized vehicle profiles, automated maintenance reminders, service booking, and a verified utility-supply marketplace.',
};

type RootLayoutProps = {
  children: ReactNode;
};

/*
  The root layout carries the document, nothing else. Page chrome belongs to the route groups —
  `(marketing)` gets the site header/footer, `(dashboard)` the sidebar, `(auth)` neither — all of
  which land in later steps. Fonts and design tokens arrive in step 1.
*/
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
