import { SERVICE_REQUEST_STATUSES } from '@/constants/enums.const';

import type { ServiceRequestStatus } from '@/types';

/*
  The booking lifecycle as a pure state machine. A booking never has its status written by hand — a caller
  names an *action*, and this file decides whether that action is legal from the current state and, if so,
  the single state it moves to. Everything a booking can and cannot do lives here, provable without a
  database, and it is reused for order fulfillment in step 12 — so proving it once pays twice.
*/

/** The five things that can be done to a booking. The center works it; the owner may only pull it back. */
export type BookingAction = 'accept' | 'decline' | 'start' | 'complete' | 'cancel';

/**
 * Which party owns each action. The center accepts, declines, starts and completes a request assigned to
 * it; the owner may only cancel their own — and only while it is still early enough to pull back. The
 * service reads this to decide whose booking an actor is allowed to touch.
 */
export const BOOKING_ACTION_ACTORS = {
  accept: 'center',
  decline: 'center',
  start: 'center',
  complete: 'center',
  cancel: 'owner',
} as const satisfies Record<BookingAction, 'owner' | 'center'>;

const { PENDING, ACCEPTED, DECLINED, IN_PROGRESS, COMPLETED, CANCELLED } = SERVICE_REQUEST_STATUSES;

/*
  The legal edges: for each action, the states it may leave and the one state it moves to. The three
  terminal states — DECLINED, COMPLETED, CANCELLED — appear in no `from` list, so every action from them
  returns null and terminality falls out of the graph rather than being a special case.
*/
const TRANSITIONS = {
  accept: { from: [PENDING], to: ACCEPTED },
  decline: { from: [PENDING], to: DECLINED },
  start: { from: [ACCEPTED], to: IN_PROGRESS },
  complete: { from: [IN_PROGRESS], to: COMPLETED },
  cancel: { from: [PENDING, ACCEPTED], to: CANCELLED },
} as const satisfies Record<BookingAction, { from: readonly ServiceRequestStatus[]; to: ServiceRequestStatus }>;

/**
 * The legal-transition guard the service consults before it writes a booking's status.
 *
 * Pure — no clock, no database — so the lifecycle is unit-testable and the same answer holds everywhere it
 * is asked. An unguarded state machine is a bug generator; this is the one arbiter.
 *
 * @param from - The booking's current status.
 * @param action - The action being attempted.
 *
 * @returns The status the action moves to, or `null` when the action is illegal from `from`.
 */
export function canTransition(from: ServiceRequestStatus, action: BookingAction): ServiceRequestStatus | null {
  const rule = TRANSITIONS[action];

  return rule.from.some(state => state === from) ? rule.to : null;
}
