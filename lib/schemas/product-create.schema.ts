import { z } from 'zod';

import { PRODUCT_CATEGORIES } from '@/constants/enums.const';

import { toMinorUnits } from '@/lib/utils';

/*
  What a supplier types to list a product. There is deliberately no `supplier` field — the seller is the
  authenticated session, never the form, so there is nothing here to spoof. `sku` is uppercased to one
  canonical form the platform-wide unique index sees; `price` is parsed from major units to the integer
  minor units the money path stores.
*/
const priceMinor = z
  .string()
  .trim()
  .min(1, 'Enter a price.')
  .transform(toMinorUnits)
  .refine(minor => !Number.isNaN(minor), 'Enter a valid price.');

const optionalDescription = z.preprocess(
  value => (value === '' || value == null ? undefined : value),
  z.string().trim().max(2000, 'Description is too long.').optional()
);

export const ProductCreateSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name.').max(160, 'Name is too long.'),
  category: z.enum(Object.values(PRODUCT_CATEGORIES)),
  sku: z.string().trim().toUpperCase().min(1, 'Enter a SKU.').max(40, 'SKU is too long.'),
  description: optionalDescription,
  price: priceMinor,
  stockQuantity: z.coerce.number().int('Enter a whole number.').min(0, 'Stock cannot be negative.'),
});

export type ProductCreateOutput = z.output<typeof ProductCreateSchema>;
