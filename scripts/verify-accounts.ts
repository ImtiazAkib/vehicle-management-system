import mongoose from 'mongoose';

import { User } from '@/models/user.model';

import { CODES } from '@/constants/codes.const';
import { RATE_LIMIT } from '@/constants/rate-limit.const';
import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';
import { AuthService, consumeRateLimit, resetRateLimit } from '@/lib/services';

const INVALID = CODES.AUTH.USERS.INVALID_CREDENTIALS;

const auth = new AuthService();

let checks = 0;

function pass(message: string): void {
  checks += 1;
  console.log(`  ok — ${message}`);
}

async function run(): Promise<void> {
  await connectToDatabase();
  console.log(`Connected to "${mongoose.connection.name}". Verifying accounts…`);

  const tag = `verify-accounts-${Date.now()}`;
  const email = `${tag}-owner@example.test`;

  await User.create({
    name: `${tag} owner`,
    email,
    password: 'password123',
    role: USER_ROLES.OWNER,
    isApproved: true,
    isActive: true,
    emailVerified: true,
  });

  try {
    // Sign-in is not a timing oracle: a wrong password and an unknown address fail the same way.
    const wrongPassword = await auth.verifyCredentials(email, 'not-the-password');
    if (wrongPassword.success || wrongPassword.errors[0]?.code !== INVALID.CODE) {
      throw new Error('a wrong password must be refused with the generic credentials error');
    }
    pass('a wrong password is refused');

    const unknownEmail = await auth.verifyCredentials(`${tag}-nobody@example.test`, 'password123');
    if (unknownEmail.success || unknownEmail.errors[0]?.code !== INVALID.CODE) {
      throw new Error('an unknown email must fail identically (anti-enumeration)');
    }
    pass('an unknown email fails identically — no account enumeration');

    const correct = await auth.verifyCredentials(email, 'password123');
    if (!correct.success || correct.result === null) {
      throw new Error('the correct credentials must succeed');
    }
    pass('the correct credentials succeed');

    // The SIGN_IN budget bounds failures per identifier, then refuses; a reset opens it again.
    const identifier = `${tag}-caller`;
    let allowed = 0;
    for (let attempt = 0; attempt < RATE_LIMIT.SIGN_IN.LIMIT; attempt += 1) {
      if (await consumeRateLimit('sign-in', identifier, RATE_LIMIT.SIGN_IN)) {
        allowed += 1;
      }
    }
    const overBudget = await consumeRateLimit('sign-in', identifier, RATE_LIMIT.SIGN_IN);
    if (allowed !== RATE_LIMIT.SIGN_IN.LIMIT || overBudget) {
      throw new Error('the sign-in budget must allow LIMIT attempts then refuse');
    }
    pass('the sign-in budget allows its limit then refuses');

    await resetRateLimit('sign-in', identifier);
    if (!(await consumeRateLimit('sign-in', identifier, RATE_LIMIT.SIGN_IN))) {
      throw new Error('a reset must reopen the budget');
    }
    pass('resetting the budget reopens it');

    console.log(`\nAll ${checks} checks passed.`);
  } finally {
    await resetRateLimit('sign-in', `${tag}-caller`);
    await User.deleteMany({ email });
    await mongoose.disconnect();
  }
}

run().catch(async error => {
  console.error('Account verification failed:', error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
