import mongoose from 'mongoose';
import { z } from 'zod';

import { User } from '@/models/user.model';

import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';

/*
  Creates the super administrator — the one account no screen can make, and the one no screen can change.
  Every other account is created by somebody already signed in (or self-registers), which leaves the first
  administrator with no way in; this is that way in, and it is deliberately the only one.

  Run it with the credentials in the environment rather than on the command line, so the password does not
  end up in shell history:

    SEED_SUPER_ADMIN_NAME="Platform Owner" \
    SEED_SUPER_ADMIN_EMAIL="owner@vusms.example" \
    SEED_SUPER_ADMIN_PASSWORD="..." \
    npm run seed:super-admin

  These three are read straight from `process.env` and validated here rather than declared in
  `env/server.ts`: they are inputs to a one-off script, not application configuration.
*/
const SeedSuperAdminSchema = z.object({
  SEED_SUPER_ADMIN_NAME: z.string().trim().min(1, 'SEED_SUPER_ADMIN_NAME is required'),
  SEED_SUPER_ADMIN_EMAIL: z.string().trim().toLowerCase().pipe(z.email('SEED_SUPER_ADMIN_EMAIL must be a valid email address')),
  SEED_SUPER_ADMIN_PASSWORD: z.string().min(8, 'SEED_SUPER_ADMIN_PASSWORD must be at least 8 characters'),
});

async function seedSuperAdmin(): Promise<void> {
  const parsed = SeedSuperAdminSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Cannot seed the super administrator:');
    parsed.error.issues.forEach(issue => console.error(`  - ${issue.path.join('.') || 'input'}: ${issue.message}`));
    console.error('\nSet SEED_SUPER_ADMIN_NAME, SEED_SUPER_ADMIN_EMAIL and SEED_SUPER_ADMIN_PASSWORD, then run again.');
    process.exitCode = 1;
    return;
  }

  const { SEED_SUPER_ADMIN_NAME, SEED_SUPER_ADMIN_EMAIL, SEED_SUPER_ADMIN_PASSWORD } = parsed.data;

  await connectToDatabase();
  console.log(`Connected to "${mongoose.connection.name}".`);

  /*
    Checked here for a readable message, and enforced by a partial unique index on the model regardless —
    two people running this at once would otherwise both pass the check. The index is what makes "exactly
    one" true; this is what makes it polite.
  */
  const existingSuperAdmin = await User.findOne({ role: USER_ROLES.SUPER_ADMIN }).lean();

  if (existingSuperAdmin) {
    console.log(`A super administrator already exists (${existingSuperAdmin.email}) — nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  const existingEmail = await User.findOne({ email: SEED_SUPER_ADMIN_EMAIL }).lean();

  if (existingEmail) {
    // Idempotent on purpose: re-running must never silently reset a password.
    console.log(`An account already exists for ${SEED_SUPER_ADMIN_EMAIL} — nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  const superAdmin = await User.create({
    name: SEED_SUPER_ADMIN_NAME,
    email: SEED_SUPER_ADMIN_EMAIL,
    // Hashed by the model's pre-save hook, never here.
    password: SEED_SUPER_ADMIN_PASSWORD,
    role: USER_ROLES.SUPER_ADMIN,
    isApproved: true,
    isActive: true,
    // The model defaults this to false and it is a sign-in gate; the seeder supplied the address, so there
    // is no third party whose ownership needs proving.
    emailVerified: true,
  });

  console.log(`Created super administrator ${superAdmin.email} (${String(superAdmin._id)}).`);
  console.log('Sign in with this account to reach the admin area.');

  await mongoose.disconnect();
}

seedSuperAdmin().catch(async error => {
  console.error('Seeding failed:', error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
