import { z } from 'zod';

import { PAYMENT_METHODS } from '@/constants/enums.const';

import { toMinorUnits } from '@/lib/utils';

/*
  Recording a settlement against an invoice. Payment happens out of band — cash, bank transfer, wallet, or
  a card taken at the counter — and this captures only the method, the amount and an optional reference. No
  card number is ever asked for or stored.
*/
const amountMinor = z
  .string()
  .trim()
  .min(1, 'Enter an amount.')
  .transform(toMinorUnits)
  .refine(minor => !Number.isNaN(minor) && minor > 0, 'Enter a valid amount.');

const optionalRef = z.preprocess(
  value => (value === '' || value == null ? undefined : value),
  z.string().trim().max(200, 'Reference is too long.').optional()
);

export const PaymentRecordSchema = z.object({
  invoiceId: z.string().min(1, 'Missing invoice.'),
  amount: amountMinor,
  method: z.enum(Object.values(PAYMENT_METHODS)),
  transactionRef: optionalRef,
});

export type PaymentRecordOutput = z.output<typeof PaymentRecordSchema>;
