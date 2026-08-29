import { z } from 'zod';

/*
  The transition contract. `confirm | pack | ship | deliver` are the supplier's fulfillment moves; `cancel`
  is the buyer's, legal only before the goods ship. Each is mapped to a legal edge by the pure
  `canAdvanceOrder` guard before the service writes anything.
*/
export const OrderStatusSchema = z.object({
  orderId: z.string().min(1, 'Missing order.'),
  action: z.enum(['confirm', 'pack', 'ship', 'deliver', 'cancel']),
});

export type OrderStatusOutput = z.output<typeof OrderStatusSchema>;
