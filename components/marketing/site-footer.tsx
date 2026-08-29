import Link from 'next/link';

import { APP_DATA } from '@/constants/app-data.const';
import { ROUTES, SECTION_IDS } from '@/constants/routes.const';

import { BrandMark } from './site-header';

const SECTIONS = [
  { label: 'Roles', href: `#${SECTION_IDS.ROLES}` },
  { label: 'Features', href: `#${SECTION_IDS.FEATURES}` },
  { label: 'Stack', href: `#${SECTION_IDS.STACK}` },
  { label: 'Roadmap', href: `#${SECTION_IDS.ROADMAP}` },
];

/** The landing footer: brand, a short line, the section anchors, the entry points and a copyright row. */
export function SiteFooter() {
  return (
    <footer className="border-border border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 lg:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex max-w-sm flex-col gap-3">
            <div className="flex items-center gap-2">
              <BrandMark />
              <span className="font-heading text-lg font-semibold tracking-tight">{APP_DATA.SHORT_NAME}</span>
            </div>
            <p className="text-muted-foreground text-sm">
              {APP_DATA.NAME} — {APP_DATA.TAGLINE}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-6">
            <nav aria-label="Sections" className="flex flex-col gap-2">
              <span className="text-foreground text-sm font-semibold">Explore</span>
              {SECTIONS.map(item => (
                <a key={item.href} href={item.href} className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  {item.label}
                </a>
              ))}
            </nav>

            <nav aria-label="Account" className="flex flex-col gap-2">
              <span className="text-foreground text-sm font-semibold">Account</span>
              <Link href={ROUTES.SIGN_IN.HREF} className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Sign in
              </Link>
              <Link href={ROUTES.REGISTER.HREF} className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Create an account
              </Link>
            </nav>
          </div>
        </div>

        <div className="border-border text-muted-foreground flex flex-col gap-2 border-t pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {APP_DATA.SHORT_NAME}. All rights reserved.
          </p>
          <p>Built with Next.js, MongoDB and Mongoose.</p>
        </div>
      </div>
    </footer>
  );
}
