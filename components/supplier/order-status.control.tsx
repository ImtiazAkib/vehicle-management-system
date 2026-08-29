import { advanceOrderAction } from './actions';

import type { OrderStatus } from '@/types';

/** The single next fulfillment step for each non-terminal status — the guard's legal edge, as a button. */
const NEXT_STEP: Partial<Record<OrderStatus, { action: string; label: string }>> = {
  PENDING: { action: 'confirm', label: 'Confirm order' },
  CONFIRMED: { action: 'pack', label: 'Mark packed' },
  PACKED: { action: 'ship', label: 'Mark shipped' },
  SHIPPED: { action: 'deliver', label: 'Mark delivered' },
};

export function OrderStatusControl({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const next = NEXT_STEP[status];

  if (!next) {
    return null;
  }

  return (
    <form action={advanceOrderAction}>
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="action" value={next.action} />
      <button
        type="submit"
        className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex rounded-md px-4 py-2 text-sm font-semibold transition-colors">
        {next.label}
      </button>
    </form>
  );
}
