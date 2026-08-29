import { z } from 'zod';

import { PRODUCT_CATEGORIES } from '@/constants/enums.const';

import { toMinorUnits } from '@/lib/utils';

/*
  A partial of the create fields — every one optional — minus `sku`: a SKU is the product's stable
  platform-wide key and is not re-keyed once set. Whatever a supplier leaves blank is left unchanged.
*/
const optionalPrice = z.preprocess(
  value => (value === '' || value == null ? undefined : value),
  z
    .string()
    .transform(toMinorUnits)
    .refine(minor => !Number.isNaN(minor), 'Enter a valid price.')
    .optional()
);

const optionalStock = z.preprocess(
  value => (value === '' || value == null ? undefined : value),
  z.coerce.number().int('Enter a whole number.').min(0, 'Stock cannot be negative.').optional()
);

const optionalDescription = z.preprocess(
  value => (value === '' || value == null ? undefined : value),
  z.string().trim().max(2000, 'Description is too long.').optional()
);

export const ProductUpdateSchema = z.object({
  name: z.preprocess(value => (value === '' || value == null ? undefined : value), z.string().trim().max(160, 'Name is too long.').optional()),
  category: z.preprocess(value => (value === '' || value == null ? undefined : value), z.enum(Object.values(PRODUCT_CATEGORIES)).optional()),
  description: optionalDescription,
  price: optionalPrice,
  stockQuantity: optionalStock,
});

export type ProductUpdateOutput = z.output<typeof ProductUpdateSchema>;
