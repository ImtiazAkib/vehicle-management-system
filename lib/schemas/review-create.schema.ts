import { z } from 'zod';

import { REVIEW_TARGET_TYPES } from '@/constants/enums.const';

/*
  What an owner submits to review a party they transacted with. The service re-checks the transaction and
  the author, so the form is trusted for the rating and comment only. `rating` is an integer 1..5.
*/
const optionalComment = z.preprocess(
  value => (value === '' || value == null ? undefined : value),
  z.string().trim().max(2000, 'Comment is too long.').optional()
);

export const ReviewCreateSchema = z.object({
  targetType: z.enum(Object.values(REVIEW_TARGET_TYPES)),
  targetId: z.string().min(1, 'Missing target.'),
  rating: z.coerce.number().int('Choose a rating.').min(1, 'Rate from 1 to 5.').max(5, 'Rate from 1 to 5.'),
  comment: optionalComment,
});

export type ReviewCreateOutput = z.output<typeof ReviewCreateSchema>;
