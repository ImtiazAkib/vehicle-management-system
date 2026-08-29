import { z } from 'zod';

/*
  What a service center edits about itself. The account (name, email, password) is managed elsewhere; this
  is the public-facing profile an owner sees when booking — so admin re-verification is not disturbed by an
  edit here, `isVerified` is never a field a center can set.
*/
const servicesOffered = z.preprocess(
  value =>
    typeof value === 'string'
      ? value
          .split(',')
          .map(part => part.trim())
          .filter(Boolean)
      : value,
  z.array(z.string().max(120)).max(50).default([])
);

export const ServiceCenterProfileSchema = z.object({
  centerName: z.string().trim().min(1, 'Enter the center name.').max(160, 'Name is too long.'),
  address: z.string().trim().min(1, 'Enter the address.').max(200, 'Address is too long.'),
  city: z.string().trim().min(1, 'Enter the city.').max(120, 'City is too long.'),
  phone: z.string().trim().min(1, 'Enter a phone number.').max(40, 'Phone number is too long.'),
  servicesOffered,
});

export type ServiceCenterProfileOutput = z.output<typeof ServiceCenterProfileSchema>;
