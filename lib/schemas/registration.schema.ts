import { z } from 'zod';

import { accountFields } from './account-fields.schema';

/*
  Self-registration is the platform's only unauthenticated write, so what this schema leaves out is the
  security story. There is no `isApproved`, no `emailVerified`, no `isVerified` — the account's state is
  the service's to decide, hard-coded there. The `role` is a closed literal per branch, so a hand-built
  request cannot name `admin`: a discriminated union of exactly the three business roles.

  A service center and a supplier carry the extra profile fields their account needs; an owner does not.
*/
const base = {
  name: accountFields.name,
  email: accountFields.email,
  password: accountFields.password,
};

const requiredPhone = z.string().trim().min(1, 'Enter a phone number.').max(40, 'Phone number is too long.');
const address = z.string().trim().min(1, 'Enter an address.').max(200, 'Address is too long.');
const city = z.string().trim().min(1, 'Enter a city.').max(120, 'City is too long.');

const ownerSchema = z.object({
  role: z.literal('owner'),
  ...base,
  phone: z.string().trim().max(40, 'Phone number is too long.').optional(),
});

const serviceCenterSchema = z.object({
  role: z.literal('service-center'),
  ...base,
  phone: requiredPhone,
  centerName: z.string().trim().min(1, 'Enter the center name.').max(160, 'Name is too long.'),
  address,
  city,
});

const supplierSchema = z.object({
  role: z.literal('supplier'),
  ...base,
  phone: requiredPhone,
  businessName: z.string().trim().min(1, 'Enter the business name.').max(160, 'Name is too long.'),
  address,
  city,
});

export const RegistrationSchema = z.discriminatedUnion('role', [ownerSchema, serviceCenterSchema, supplierSchema]);

export type RegistrationOutput = z.output<typeof RegistrationSchema>;
