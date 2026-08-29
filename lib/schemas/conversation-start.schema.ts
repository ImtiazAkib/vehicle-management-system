import { z } from 'zod';

/*
  Starting a conversation. It is scoped to one of the owner's own bookings — the service center is taken
  from the booking, never named by the form — so `startOrFind` derives the two participants from a booking
  the caller already owns.
*/
export const ConversationStartSchema = z.object({
  serviceRequestId: z.string().min(1, 'Missing booking.'),
});

export type ConversationStartOutput = z.output<typeof ConversationStartSchema>;
