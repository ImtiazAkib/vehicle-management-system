import Link from 'next/link';

import { APP_DATA } from '@/constants/app-data.const';
import { ROUTES, SECTION_IDS } from '@/constants/routes.const';

const NAV = [
  { label: 'Roles', href: `#${SECTION_IDS.ROLES}` },
  { label: 'Features', href: `#${SECTION_IDS.FEATURES}` },
  { label: 'Stack', href: `#${SECTION_IDS.STACK}` },
  { label: 'Roadmap', href: `#${SECTION_IDS.ROADMAP}` },
];

/** The brand mark — the platform initial in a rounded primary tile. Reused by the footer. */
export function BrandMark() {
  return (
    <span className="bg-primary text-primary-foreground font-heading grid size-8 shrink-0 place-items-center rounded-md text-sm font-bold">V</span>
  );
}

/** The sticky landing header: brand, the section anchors, and the two entry points. */
export function SiteHeader() {
  return (
    <header className="border-border bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 lg:px-6">
        <Link href={ROUTES.HOME.HREF} className="flex items-center gap-2">
          <BrandMark />
          <span className="font-heading text-lg font-semibold tracking-tight">{APP_DATA.SHORT_NAME}</span>
        </Link>

        <nav aria-label="Sections" className="hidden items-center gap-6 md:flex">
          {NAV.map(item => (
            <a key={item.href} href={item.href} className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link href={ROUTES.SIGN_IN.HREF} className="hover:bg-muted rounded-md px-3 py-2 text-sm font-medium transition-colors">
            Sign in
          </Link>
          <Link
            href={ROUTES.REGISTER.HREF}
            className="bg-primary text-primary-foreground hover:bg-primary-hover rounded-md px-4 py-2 text-sm font-semibold transition-colors">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
