import { cache } from 'react';

import { cookies } from 'next/headers';

import { User } from '@/models/user.model';
import { SessionUser } from '@/types';

import { SESSION } from '@/constants/auth.const';
import { ADMIN_AREA_ROLES } from '@/constants/roles.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';

import { verifySessionToken } from './session';

import type { UserEntity } from '@/models/user.model';

const log = createLoggerWithContext('current-user');

/**
 * Read the current session in a server component, layout or route handler.
 *
 * The token alone is not trusted. A signed token proves who signed in and when, but not that the account
 * is still active, still approved, or still holds the role the token claims — an administrator may have
 * deactivated it, revoked its verification, or changed its role in the meantime. So the live row is loaded
 * and checked on every call, which is what makes those actions take effect at once rather than waiting up
 * to an hour for the token to expire. The returned name, email and role come from the row, not the stale
 * token.
 *
 * This runs only in the Node runtime — it reads `next/headers` and touches Mongoose. The middleware
 * verifies the signature alone.
 *
 * On a database error the behavior splits by privilege. For an administrator or the super administrator
 * the check fails **closed** — a `null` session — because an account that can create other accounts and
 * verify businesses is exactly the one whose revocation must not wait on a database blip. For every other
 * role it fails **open** to the verified token, so a momentary outage cannot lock an owner out of their
 * own vehicles or a service center out of its work mid-shift; the one-hour token lifetime still bounds
 * that exposure.
 *
 * Wrapped in React's `cache()`, so the whole thing runs **once per request** however many times it is
 * called. A guarded page calls it at least twice — the dashboard layout runs `requireSession()` and the
 * page then runs its own role guard — and without this that is two `jwtVerify` calls and two database
 * round trips for one page view. Next dedupes `fetch`; it does not dedupe Mongoose.
 *
 * @returns The signed-in user, or null when there is no valid session.
 */
export const getSessionUser = cache(async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION.COOKIE.NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return null;
  }

  try {
    await connectToDatabase();

    const account = await User.findById(session.userId).select('name email role isActive isApproved').lean<UserEntity | null>();

    /*
      Deleted, deactivated, de-approved, or the role changed since the token was minted — the session is no
      longer valid, regardless of how long the token has left to run.
    */
    if (!account || !account.isActive || !account.isApproved || account.role !== session.role) {
      return null;
    }

    return { userId: session.userId, email: account.email, name: account.name, role: account.role, isApproved: account.isApproved };
  } catch (error) {
    /*
      Fail closed for the privileged roles, open for the rest. A stale administrator session outliving a
      database outage is a worse outcome than one locked out for the length of the blip; an owner or
      service center locked out mid-shift is the worse outcome the other way. The identifier is never a log
      field.
    */
    if (ADMIN_AREA_ROLES.some(role => role === session.role)) {
      log.warn({ err: error }, 'Re-validating a privileged session against the database failed; refusing it');

      return null;
    }

    log.warn({ err: error }, 'Re-validating a session against the database failed; trusting the token');

    return session;
  }
});
