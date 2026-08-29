import { z } from 'zod';

import { toMinorUnits } from '@/lib/utils';

/*
  Issuing a SERVICE invoice for a completed booking. The subtotal is the booking's final cost the service
  already holds, so the center supplies only the reference and an optional tax; the total is derived, never
  typed, so the three amounts can never disagree.
*/
const optionalTax = z.preprocess(
  value => (value === '' || value == null ? undefined : value),
  z
    .string()
    .transform(toMinorUnits)
    .refine(minor => !Number.isNaN(minor), 'Enter a valid tax amount.')
    .optional()
);

export const ServiceInvoiceIssueSchema = z.object({
  serviceRequestId: z.string().min(1, 'Missing booking.'),
  tax: optionalTax,
});

export type ServiceInvoiceIssueOutput = z.output<typeof ServiceInvoiceIssueSchema>;
