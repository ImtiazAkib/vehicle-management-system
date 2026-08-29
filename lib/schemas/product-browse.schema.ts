import { z } from 'zod';

import { PRODUCT_CATEGORIES } from '@/constants/enums.const';

import { toMinorUnits } from '@/lib/utils';

/*
  The browse filter contract, parsed from the URL search params — so a filtered view is a link you can
  paste, not client state that evaporates on reload. Every field is optional; an unparseable one falls back
  rather than erroring, because a bad query string is a visitor's typo, not a crash.
*/
const optionalPrice = z.preprocess(
  value => (value === '' || value == null ? undefined : value),
  z
    .string()
    .transform(toMinorUnits)
    .refine(minor => !Number.isNaN(minor), { message: 'Invalid price' })
    .optional()
    .catch(undefined)
);

export const ProductBrowseSchema = z.object({
  category: z.preprocess(
    value => (value === '' || value == null ? undefined : value),
    z.enum(Object.values(PRODUCT_CATEGORIES)).optional().catch(undefined)
  ),
  q: z.preprocess(value => (value === '' || value == null ? undefined : value), z.string().trim().max(120).optional()),
  minPrice: optionalPrice,
  maxPrice: optionalPrice,
  page: z.coerce.number().int().min(1).catch(1),
});

export type ProductBrowseOutput = z.output<typeof ProductBrowseSchema>;
