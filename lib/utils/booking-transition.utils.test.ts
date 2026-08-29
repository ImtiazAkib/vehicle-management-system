import { describe, expect, it } from 'vitest';

import { SERVICE_REQUEST_STATUSES } from '@/constants/enums.const';

import { canTransition } from './booking-transition.utils';

import type { BookingAction } from './booking-transition.utils';

/*
  The booking lifecycle is only ever as right as this guard, so the cases below walk every legal edge, a
  representative set of illegal ones, and terminality — a DECLINED, COMPLETED or CANCELLED booking must
  refuse every further move.
*/
const { PENDING, ACCEPTED, DECLINED, IN_PROGRESS, COMPLETED, CANCELLED } = SERVICE_REQUEST_STATUSES;

describe('canTransition', () => {
  it('accepts a pending request', () => {
    expect(canTransition(PENDING, 'accept')).toBe(ACCEPTED);
  });

  it('declines a pending request', () => {
    expect(canTransition(PENDING, 'decline')).toBe(DECLINED);
  });

  it('cancels from the early states', () => {
    expect(canTransition(PENDING, 'cancel')).toBe(CANCELLED);
    expect(canTransition(ACCEPTED, 'cancel')).toBe(CANCELLED);
  });

  it('starts an accepted request', () => {
    expect(canTransition(ACCEPTED, 'start')).toBe(IN_PROGRESS);
  });

  it('completes a request in progress', () => {
    expect(canTransition(IN_PROGRESS, 'complete')).toBe(COMPLETED);
  });

  it('refuses to cancel once work has started', () => {
    expect(canTransition(IN_PROGRESS, 'cancel')).toBeNull();
  });

  it('refuses to complete a request that was never started', () => {
    expect(canTransition(PENDING, 'complete')).toBeNull();
  });

  it('refuses to re-accept an already-accepted request', () => {
    expect(canTransition(ACCEPTED, 'accept')).toBeNull();
  });

  it('refuses to go backwards from completed', () => {
    expect(canTransition(COMPLETED, 'start')).toBeNull();
  });

  it('treats declined, completed and cancelled as terminal', () => {
    const actions: BookingAction[] = ['accept', 'decline', 'start', 'complete', 'cancel'];

    for (const terminal of [DECLINED, COMPLETED, CANCELLED]) {
      for (const action of actions) {
        expect(canTransition(terminal, action)).toBeNull();
      }
    }
  });
});
