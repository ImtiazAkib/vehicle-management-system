import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';

import { env } from '@/env/server';
import { SessionUser } from '@/types';

import { SESSION } from '@/constants/auth.const';
import { USER_ROLES } from '@/constants/roles.const';

import { createSessionToken, verifySessionToken } from './session';

/*
  The same key the module signs with, so the negative cases can forge tokens that are correctly signed but
  wrong in exactly one way — a bad payload, a stale expiry, another audience — which is what proves the
  checks past the signature actually run.
*/
const secret = new TextEncoder().encode(env.AUTH_SECRET);

const sessionUser: SessionUser = {
  userId: '507f1f77bcf86cd799439011',
  email: 'owner@example.com',
  name: 'Test Owner',
  role: USER_ROLES.OWNER,
  isApproved: true,
};

describe('verifySessionToken', () => {
  it('round-trips a session user through mint and verify', async () => {
    const token = await createSessionToken(sessionUser);

    expect(await verifySessionToken(token)).toEqual(sessionUser);
  });

  it('returns null for a string that is not a JWT', async () => {
    expect(await verifySessionToken('not-a-token')).toBeNull();
  });

  it('returns null for a token signed with a different secret', async () => {
    const otherSecret = new TextEncoder().encode('a-completely-different-secret-thirty-two');

    const forged = await new SignJWT({ ...sessionUser })
      .setProtectedHeader({ alg: SESSION.ALGORITHM })
      .setIssuedAt()
      .setIssuer(SESSION.ISSUER)
      .setAudience(SESSION.AUDIENCE)
      .setExpirationTime(`${SESSION.COOKIE.MAX_AGE}s`)
      .sign(otherSecret);

    expect(await verifySessionToken(forged)).toBeNull();
  });

  it('returns null for a correctly signed token whose payload no longer matches the shape', async () => {
    // Everything valid except the missing `role`, so the signature passes and the schema does not.
    const stale = await new SignJWT({ userId: sessionUser.userId, email: sessionUser.email, name: sessionUser.name, isApproved: true })
      .setProtectedHeader({ alg: SESSION.ALGORITHM })
      .setIssuedAt()
      .setIssuer(SESSION.ISSUER)
      .setAudience(SESSION.AUDIENCE)
      .setExpirationTime(`${SESSION.COOKIE.MAX_AGE}s`)
      .sign(secret);

    expect(await verifySessionToken(stale)).toBeNull();
  });

  it('returns null for an expired token', async () => {
    const expired = await new SignJWT({ ...sessionUser })
      .setProtectedHeader({ alg: SESSION.ALGORITHM })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 60 * 60)
      .setIssuer(SESSION.ISSUER)
      .setAudience(SESSION.AUDIENCE)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(secret);

    expect(await verifySessionToken(expired)).toBeNull();
  });

  it('returns null for a token minted for another audience', async () => {
    const wrongAudience = await new SignJWT({ ...sessionUser })
      .setProtectedHeader({ alg: SESSION.ALGORITHM })
      .setIssuedAt()
      .setIssuer(SESSION.ISSUER)
      .setAudience('some-other-service')
      .setExpirationTime(`${SESSION.COOKIE.MAX_AGE}s`)
      .sign(secret);

    expect(await verifySessionToken(wrongAudience)).toBeNull();
  });
});
