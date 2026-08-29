import { z } from 'zod';

/*
  What a supplier edits about itself — the public-facing business details a buyer sees. As with the service
  center, `isVerified` is never a writable field; admin verification is granted, not self-asserted.
*/
export const SupplierProfileSchema = z.object({
  businessName: z.string().trim().min(1, 'Enter the business name.').max(160, 'Name is too long.'),
  address: z.string().trim().min(1, 'Enter the address.').max(200, 'Address is too long.'),
  city: z.string().trim().min(1, 'Enter the city.').max(120, 'City is too long.'),
  phone: z.string().trim().min(1, 'Enter a phone number.').max(40, 'Phone number is too long.'),
});

export type SupplierProfileOutput = z.output<typeof SupplierProfileSchema>;
