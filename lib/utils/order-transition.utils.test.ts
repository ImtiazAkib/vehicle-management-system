import { describe, expect, it } from 'vitest';

import { ORDER_STATUSES } from '@/constants/enums.const';

import { canAdvanceOrder } from './order-transition.utils';

import type { OrderAction } from './order-transition.utils';

const { PENDING, CONFIRMED, PACKED, SHIPPED, DELIVERED, CANCELLED } = ORDER_STATUSES;

describe('canAdvanceOrder', () => {
  it('walks the full fulfillment path', () => {
    expect(canAdvanceOrder(PENDING, 'confirm')).toBe(CONFIRMED);
    expect(canAdvanceOrder(CONFIRMED, 'pack')).toBe(PACKED);
    expect(canAdvanceOrder(PACKED, 'ship')).toBe(SHIPPED);
    expect(canAdvanceOrder(SHIPPED, 'deliver')).toBe(DELIVERED);
  });

  it('cancels only before the goods ship', () => {
    expect(canAdvanceOrder(PENDING, 'cancel')).toBe(CANCELLED);
    expect(canAdvanceOrder(CONFIRMED, 'cancel')).toBe(CANCELLED);
    expect(canAdvanceOrder(PACKED, 'cancel')).toBe(CANCELLED);
    expect(canAdvanceOrder(SHIPPED, 'cancel')).toBeNull();
  });

  it('refuses a jump that skips a stage', () => {
    expect(canAdvanceOrder(PENDING, 'ship')).toBeNull();
    expect(canAdvanceOrder(PENDING, 'deliver')).toBeNull();
    expect(canAdvanceOrder(CONFIRMED, 'ship')).toBeNull();
  });

  it('refuses re-running a stage', () => {
    expect(canAdvanceOrder(CONFIRMED, 'confirm')).toBeNull();
    expect(canAdvanceOrder(SHIPPED, 'ship')).toBeNull();
  });

  it('treats delivered and cancelled as terminal', () => {
    const actions: OrderAction[] = ['confirm', 'pack', 'ship', 'deliver', 'cancel'];

    for (const terminal of [DELIVERED, CANCELLED]) {
      for (const action of actions) {
        expect(canAdvanceOrder(terminal, action)).toBeNull();
      }
    }
  });
});
