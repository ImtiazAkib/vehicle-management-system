import { z } from 'zod';

import { toMinorUnits } from '@/lib/utils';

import { RecordOnCompletionSchema } from './record-on-completion.schema';

/*
  A booking moves only by naming one of five actions, and each edge carries its own required data: an
  ACCEPT commits a date and an estimate; a COMPLETE commits a final cost and the facts of the maintenance
  record it writes (step 10); the other three carry nothing but the booking id. Modelling that as a
  discriminated union means the fields an edge needs are present and typed by the time the service applies
  them — a booking cannot reach ACCEPTED without the estimate that makes acceptance mean something.
*/
const requestId = z.string().min(1, 'Missing booking.');

const moneyMinor = z
  .string()
  .trim()
  .min(1, 'Enter a price.')
  .transform(toMinorUnits)
  .refine(minor => !Number.isNaN(minor), 'Enter a valid price.');

export const BookingTransitionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('accept'), serviceRequestId: requestId, scheduledDate: z.coerce.date(), estimatedCost: moneyMinor }),
  z.object({ action: z.literal('decline'), serviceRequestId: requestId }),
  z.object({ action: z.literal('start'), serviceRequestId: requestId }),
  z.object({ action: z.literal('complete'), serviceRequestId: requestId, finalCost: moneyMinor, ...RecordOnCompletionSchema.shape }),
  z.object({ action: z.literal('cancel'), serviceRequestId: requestId }),
]);

export type BookingTransitionOutput = z.output<typeof BookingTransitionSchema>;
