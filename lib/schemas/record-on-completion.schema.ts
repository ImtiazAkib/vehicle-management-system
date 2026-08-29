import { z } from 'zod';

const optionalNotes = z.preprocess(
  value => (value === '' || value == null ? undefined : value),
  z.string().trim().max(2000, 'Notes are too long.').optional()
);

/*
  What the center records as it completes a booking — the facts a durable maintenance record needs beyond
  the final cost the transition already carries: the odometer reading at service, and any notes. Kept as
  its own schema because the record is a first-class thing (step 10), even though it rides in on the
  `complete` transition (step 9).
*/
export const RecordOnCompletionSchema = z.object({
  mileageAtService: z.coerce.number().int('Enter the mileage at service.').min(0, 'Mileage cannot be negative.'),
  notes: optionalNotes,
});

export type RecordOnCompletionOutput = z.output<typeof RecordOnCompletionSchema>;
