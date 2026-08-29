import { RateLimit } from '@/models/rate-limit.model';

import { RateLimitBudget } from '@/constants/rate-limit.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';

import { hashToken } from './token.hash';

const log = createLoggerWithContext('rate-limit.guard');

/*
  The application's one rate limiter — a fixed window counted in the database, imported straight from
  `models/rate-limit.model` rather than the barrel because the counter is infrastructure, not a domain
  surface.

  **Not in `proxy.ts`.** The middleware runtime does not load Mongoose at all, and it cannot see what
  needs limiting anyway: sign-in, registration and the resend are Server Actions that POST to the same
  URL as the page that rendered them, told apart only by an opaque per-build header. The proxy is a
  perimeter; a limit is a control, and a control lives where the action does.

  **One round trip, and it has to be.** `findOneAndUpdate` with `$inc` and `$setOnInsert` is atomic at
  the document, so two requests arriving together increment the same counter rather than each reading
  zero and writing one. A read-then-write would be a race with a free extra attempt in it.
*/

/**
 * Count one attempt against a budget for `action:identifier`, and say whether it is allowed.
 *
 * **Fails open on a database error, deliberately.** A limiter is a guard on top of a control, never the
 * control itself — the sign-in still checks the password, the gate still checks the role. Refusing
 * everybody because the counter could not be read would turn a database blip into an outage of the
 * whole application, which is a worse failure than briefly not throttling. So a thrown limiter returns
 * `true` (allow) and logs.
 *
 * @param action - Which budget this is, so two limits on one caller stay apart.
 * @param identifier - Who or what is being counted — an email, an address, a user id.
 * @param budget - How many attempts, and over how long.
 *
 * @returns True when the attempt may proceed, false when it is over budget.
 */
export async function consumeRateLimit(action: string, identifier: string, budget: RateLimitBudget): Promise<boolean> {
  try {
    await connectToDatabase();

    const now = Date.now();
    const windowMs = budget.WINDOW_MINUTES * 60 * 1000;
    const key = buildKey(action, identifier);

    const record = await RateLimit.findOneAndUpdate(
      { key },
      {
        $inc: { count: 1 },
        // Set only when the row is first inserted, so the window opens once and every later attempt in
        // it counts against the same deadline rather than pushing it forward.
        $setOnInsert: { expiresAt: new Date(now + windowMs) },
      },
      { upsert: true, returnDocument: 'after' }
    ).lean<{ count: number; expiresAt: Date } | null>();

    if (!record) {
      return true;
    }

    /*
      A row whose window has already closed is the empty window it represents, not a full one. It is
      read rather than trusted to be gone because the TTL monitor sweeps on its own schedule — roughly
      once a minute — so an expired document is routinely still here, and treating its `count` as
      current would keep a caller throttled for as long as the sweep took to come round. Roll the
      window forward in one write and let this attempt through as its first.
    */
    if (record.expiresAt.getTime() <= now) {
      await RateLimit.updateOne({ key }, { $set: { count: 1, expiresAt: new Date(now + windowMs) } });

      return true;
    }

    return record.count <= budget.LIMIT;
  } catch (error) {
    // Fail OPEN — see the method comment. A limiter that could not read its counter allows the request.
    log.error({ err: error, action }, 'Rate limit check failed, allowing the request');

    return true;
  }
}

/**
 * Forget a key's attempts.
 *
 * What makes a failure-counted budget humane: somebody who mistypes twice and then signs in
 * successfully is back to a full allowance, rather than carrying two used attempts around for the rest
 * of the window. Called on a *successful* sign-in, so `SIGN_IN` bounds consecutive failures rather than
 * legitimate use.
 *
 * @param action - Which budget to clear.
 * @param identifier - Whose attempts to forget.
 */
export async function resetRateLimit(action: string, identifier: string): Promise<void> {
  try {
    await connectToDatabase();

    await RateLimit.deleteOne({ key: buildKey(action, identifier) });
  } catch (error) {
    // The same fail-open posture: a reset that could not run leaves an old count in place, which the
    // window expires on its own soon enough — never a reason to fail the sign-in it accompanied.
    log.error({ err: error, action }, 'Clearing a rate limit failed');
  }
}

/**
 * The stored key for an action and an identifier.
 *
 * The identifier is trimmed, lowercased and hashed. Lowercased so `A@x` and `a@x ` are one caller
 * rather than two allowances; hashed so this collection never becomes a second place the application
 * keeps an email or an address — it only ever needs to match a key against itself, which a digest does
 * as well as the value.
 *
 * @param action - Budget name.
 * @param identifier - Raw identity.
 *
 * @returns The key to count against.
 */
function buildKey(action: string, identifier: string): string {
  return `${action}:${hashToken(identifier.trim().toLowerCase())}`;
}
