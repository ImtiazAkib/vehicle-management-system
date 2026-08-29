import { UserRole } from '@/types';

/*
  `typedRoutes` is on, so a `<Link>` to a route that does not exist is a build error rather than a 404 a
  visitor finds. These entries are plain strings used by guards and nav; each becomes a linkable route
  as the step that builds its page lands.
*/
export const ROUTES = {
  HOME: { LABEL: 'Home', HREF: '/' },

  /*
    The self-registration and account-recovery flow — all public, all outside the dashboard shell. A
    business role creates an account, is told to check their inbox, proves the address by following the
    link, and can ask for another link or reset a password. Only the token-bearing pages are kept out of
    the index — see their page metadata. These land in step 6.
  */
  SIGN_IN: { LABEL: 'Sign in', HREF: '/sign-in' },
  REGISTER: { LABEL: 'Create an account', HREF: '/register' },
  REGISTER_OWNER: { LABEL: 'Register as a vehicle owner', HREF: '/register/owner' },
  REGISTER_SERVICE_CENTER: { LABEL: 'Register a service center', HREF: '/register/service-center' },
  REGISTER_SUPPLIER: { LABEL: 'Register as a supplier', HREF: '/register/supplier' },
  REGISTRATION_RECEIVED: { LABEL: 'Check your inbox', HREF: '/registration-received' },
  VERIFY_EMAIL: { LABEL: 'Verify your email', HREF: '/verify-email' },
  VERIFY_EMAIL_CHANGE: { LABEL: 'Confirm your new email', HREF: '/verify-email-change' },
  RESEND_VERIFICATION: { LABEL: 'Resend the link', HREF: '/resend-verification' },
  FORGOT_PASSWORD: { LABEL: 'Forgot your password', HREF: '/forgot-password' },
  RESET_PASSWORD: { LABEL: 'Reset your password', HREF: '/reset-password' },
  UNAUTHORIZED: { LABEL: 'Not allowed', HREF: '/unauthorized' },

  /*
    The four role areas. Each is the home a role lands on after signing in and the only area it may
    enter — the guard on the segment's layout decides that, `ROLE_HOME` below routes to it. The shared
    profile sits outside the role areas, behind the session alone. These land in step 5.
  */
  ADMIN: { LABEL: 'Administration', HREF: '/admin' },
  OWNER: { LABEL: 'My vehicles', HREF: '/owner' },
  CENTER: { LABEL: 'Service center', HREF: '/center' },
  SUPPLIER: { LABEL: 'Supplier', HREF: '/supplier' },
  PROFILE: { LABEL: 'Profile', HREF: '/profile' },
} as const;

/**
 * Where each role lands after signing in, and the only area it may enter.
 *
 * `as const satisfies Record<UserRole, string>` — the `satisfies` makes it exhaustive, so a new role is
 * a compile error here rather than an account that signs in and lands nowhere, while `as const` keeps
 * the literal union the router needs.
 */
export const ROLE_HOME = {
  // The super administrator lands in the admin area — it is their area too, with more in it.
  'super-admin': ROUTES.ADMIN.HREF,
  admin: ROUTES.ADMIN.HREF,
  owner: ROUTES.OWNER.HREF,
  'service-center': ROUTES.CENTER.HREF,
  supplier: ROUTES.SUPPLIER.HREF,
} as const satisfies Record<UserRole, string>;

/*
  Route segments that require a session. One list, used twice: `proxy.ts` guards them (step 5) and
  `seo.const.ts` disallows them in robots.txt (step 2). Writing it here once means a route can never be
  guarded but crawlable, or crawlable but unguarded.
*/
export const PROTECTED_SEGMENTS = [
  ROUTES.ADMIN.HREF,
  ROUTES.OWNER.HREF,
  ROUTES.CENTER.HREF,
  ROUTES.SUPPLIER.HREF,
  ROUTES.PROFILE.HREF,
] as const satisfies readonly string[];

/** Anchors on the landing page (step 2). */
export const SECTION_IDS = {
  ROLES: 'roles',
  FEATURES: 'features',
  STACK: 'stack',
  ROADMAP: 'roadmap',
} as const;
