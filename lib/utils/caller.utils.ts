/**
 * The header a reverse proxy uses to report who it is forwarding for.
 */
const FORWARDED_FOR = 'x-forwarded-for';

/**
 * A stand-in for a caller with no session, so an unauthenticated endpoint has something to count
 * against.
 *
 * **How far this can be trusted is a property of the deployment, and it is worth being plain about.**
 * On a platform that sets `x-forwarded-for` itself a client cannot override it; behind a self-hosted
 * proxy it is whatever that proxy was configured to send — and if nothing is configured, it is whatever
 * the client typed, which makes a limit keyed on it a formality that rotating a header defeats.
 *
 * That is why the header is read **only when `trustForwardedFor` is true** — the deployment's own
 * assertion (`TRUSTED_PROXY`) that a proxy overwrites it. A limiter that trusts a header a client can
 * forge is a limiter an attacker sets to someone else's address, so it is off by default. Untrusted,
 * everyone shares one bucket, which degrades the limit to a single shared budget rather than to none —
 * visible and a little annoying on a local run, the failure worth having over a silently absent one.
 *
 * The first entry is taken because a forwarding chain appends: the leftmost is the original client and
 * everything after it is a hop. The trust flag is passed in rather than read from server env here, so
 * the helper stays safe to pull into a client bundle.
 *
 * @param headers - The request's headers.
 * @param trustForwardedFor - Whether `x-forwarded-for` may be believed on this deployment.
 *
 * @returns Something stable to count against, or a shared fallback when there is nothing to trust.
 */
export function resolveCallerKey(headers: Headers, trustForwardedFor: boolean): string {
  const forwarded = trustForwardedFor ? headers.get(FORWARDED_FOR) : null;

  if (!forwarded) {
    return 'unknown-caller';
  }

  const [client] = forwarded.split(',');

  return client.trim() || 'unknown-caller';
}
