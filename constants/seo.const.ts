import { PROTECTED_SEGMENTS, ROUTES } from './routes.const';

/*
  Route segments that must never be indexed: everything behind a session, plus the sign-in and
  unauthorized pages. Derived from `PROTECTED_SEGMENTS` so the crawler rules and the route guard cannot
  drift apart. The `Disallow` lines are only a request to well-behaved crawlers; the enforcing half is
  the `noindex` metadata on the sign-in page and the dashboard layout.
*/
const PRIVATE_SEGMENTS: readonly string[] = [ROUTES.SIGN_IN.HREF, ROUTES.UNAUTHORIZED.HREF, ...PROTECTED_SEGMENTS];

export const SEO = {
  KEYWORDS: [
    'vehicle maintenance software',
    'car service booking',
    'maintenance reminder app',
    'auto parts marketplace',
    'service history tracker',
    'fleet maintenance',
    'vehicle utilities supply',
    'role-based access control',
    'Next.js MongoDB',
  ],

  /*
    The fixed public routes, in the order the sitemap lists them. The app is a private platform behind a
    session, so only the marketing home page is public — there is no public catalogue to enumerate.
  */
  PUBLIC_ROUTES: [ROUTES.HOME.HREF],

  DISALLOWED_PATHS: PRIVATE_SEGMENTS,

  SITEMAP: {
    HOME_PRIORITY: 1,
    CHANGE_FREQUENCY: 'monthly',
  },
} as const;
