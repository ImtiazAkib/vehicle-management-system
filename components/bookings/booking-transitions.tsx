import { APP_DATA } from '@/constants/app-data.const';

import type { BookingAction } from '@/lib/utils';

import { transitionBookingAction } from './actions';

const buttonClassName = 'rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted';
const primaryButtonClassName = 'rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary-hover';
const inputClassName =
  'rounded-md border border-input bg-card px-2 py-1 text-xs font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** A one-click transition — decline, start or cancel — that carries no extra data. */
export function TransitionButton({ requestId, action, label }: { requestId: string; action: BookingAction; label: string }) {
  return (
    <form action={transitionBookingAction}>
      <input type="hidden" name="serviceRequestId" value={requestId} />
      <input type="hidden" name="action" value={action} />
      <button type="submit" className={action === 'cancel' || action === 'decline' ? buttonClassName : primaryButtonClassName}>
        {label}
      </button>
    </form>
  );
}

/** Accepting a booking commits a scheduled date and a cost estimate, so it carries both. */
export function AcceptForm({ requestId }: { requestId: string }) {
  return (
    <form action={transitionBookingAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="serviceRequestId" value={requestId} />
      <input type="hidden" name="action" value="accept" />
      <label className="flex flex-col gap-1 text-xs font-medium">
        Scheduled date
        <input type="date" name="scheduledDate" required className={inputClassName} />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium">
        Estimate ({APP_DATA.CURRENCY.SYMBOL})
        <input type="text" name="estimatedCost" inputMode="decimal" placeholder="0.00" required className={inputClassName} />
      </label>
      <button type="submit" className={primaryButtonClassName}>
        Accept
      </button>
    </form>
  );
}

/** Completing a booking commits the final cost. */
export function CompleteForm({ requestId }: { requestId: string }) {
  return (
    <form action={transitionBookingAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="serviceRequestId" value={requestId} />
      <input type="hidden" name="action" value="complete" />
      <label className="flex flex-col gap-1 text-xs font-medium">
        Final cost ({APP_DATA.CURRENCY.SYMBOL})
        <input type="text" name="finalCost" inputMode="decimal" placeholder="0.00" required className={inputClassName} />
      </label>
      <button type="submit" className={primaryButtonClassName}>
        Mark complete
      </button>
    </form>
  );
}
