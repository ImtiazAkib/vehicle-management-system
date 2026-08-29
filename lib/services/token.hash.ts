import { createHash, randomBytes } from 'node:crypto';

/**
 * A one-time token in its two forms: the raw string that goes in a link, and the hash that is all
 * the database ever holds.
 *
 * They are minted together and immediately part ways — the raw leaves in an email and is never
 * stored, the hash is stored and never leaves. A row lifted from a database dump therefore carries
 * no working link, because the raw cannot be recovered from the hash.
 */
export type VerificationToken = {
  raw: string;
  hash: string;
};

/**
 * Mint a fresh verification token and its stored hash.
 *
 * The raw is 32 bytes of `randomBytes` in `base64url` — high enough entropy that guessing one is
 * not an attack worth trying, and URL-safe so it survives being a query parameter untouched. The
 * hash is what the row keeps; see `hashToken` for why it is an unsalted SHA-256.
 *
 * Pure, and it touches no database — the caller writes the hash and mails the raw.
 *
 * @returns The raw token to send, and the hash to store.
 */
export function generateVerificationToken(): VerificationToken {
  const raw = randomBytes(32).toString('base64url');

  return { raw, hash: hashToken(raw) };
}

/**
 * Reduce a raw token to what is safe to store.
 *
 * Used both when a token is minted and when one presented at a link is checked, so the two cannot
 * disagree — a token hashed one way and looked up another is a link that never works, discovered by
 * the person it was sent to.
 *
 * Unsalted SHA-256 on purpose, unlike a password. The input is 32 bytes of `randomBytes` rather
 * than something somebody chose, so there is no dictionary to precompute and nothing a slow hash
 * would buy — while a lookup by hash has to be a single indexed query, which a per-row salt would
 * make impossible.
 *
 * @param raw - The raw token from a link.
 *
 * @returns Its hex-encoded digest, which is what the database holds.
 */
export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
