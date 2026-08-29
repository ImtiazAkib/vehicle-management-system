import { ORDER_STATUSES } from '@/constants/enums.const';

import type { OrderStatus } from '@/types';

/*
  The order fulfillment lifecycle as a pure state machine — the same guarded shape the booking transitions
  use (step 9), reused here so proving it once pays twice. A caller names an *action*, and this decides
  whether it is legal from the current status and the single status it moves to. The status field is never
  written raw.
*/

/** The five things that can be done to an order. The supplier fulfills it; the buyer may only pull it back. */
export type OrderAction = 'confirm' | 'pack' | 'ship' | 'deliver' | 'cancel';

/** Which party owns each action — the supplier advances fulfillment; the buyer cancels, but only before it ships. */
export const ORDER_ACTION_ACTORS = {
  confirm: 'supplier',
  pack: 'supplier',
  ship: 'supplier',
  deliver: 'supplier',
  cancel: 'buyer',
} as const satisfies Record<OrderAction, 'buyer' | 'supplier'>;

const { PENDING, CONFIRMED, PACKED, SHIPPED, DELIVERED, CANCELLED } = ORDER_STATUSES;

/*
  The legal edges. `DELIVERED` and `CANCELLED` appear in no `from` list, so they are terminal by
  construction. Cancel is legal only before the goods ship — once shipped, they are gone.
*/
const TRANSITIONS = {
  confirm: { from: [PENDING], to: CONFIRMED },
  pack: { from: [CONFIRMED], to: PACKED },
  ship: { from: [PACKED], to: SHIPPED },
  deliver: { from: [SHIPPED], to: DELIVERED },
  cancel: { from: [PENDING, CONFIRMED, PACKED], to: CANCELLED },
} as const satisfies Record<OrderAction, { from: readonly OrderStatus[]; to: OrderStatus }>;

/**
 * The legal-transition guard the order service consults before it writes a status. Pure — no clock, no
 * database — so the lifecycle is unit-testable.
 *
 * @param from - The order's current status.
 * @param action - The action being attempted.
 *
 * @returns The status the action moves to, or `null` when the action is illegal from `from`.
 */
export function canAdvanceOrder(from: OrderStatus, action: OrderAction): OrderStatus | null {
  const rule = TRANSITIONS[action];

  return rule.from.some(status => status === from) ? rule.to : null;
}
