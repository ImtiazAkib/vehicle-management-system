import { BILLING_BUSINESS, BILLING_DATABASE, BILLING_VALIDATION } from './codes-billing.const';
import { BOOKINGS_BUSINESS, BOOKINGS_DATABASE, BOOKINGS_VALIDATION } from './codes-bookings.const';
import { COMMON_AUTH, COMMON_BUSINESS, COMMON_DATABASE, COMMON_VALIDATION } from './codes-common.const';
import { MARKETPLACE_BUSINESS, MARKETPLACE_DATABASE, MARKETPLACE_VALIDATION } from './codes-marketplace.const';
import { ORDERS_BUSINESS, ORDERS_DATABASE, ORDERS_VALIDATION } from './codes-orders.const';
import { SCHEDULING_DATABASE, SCHEDULING_VALIDATION } from './codes-scheduling.const';
import { USERS_AUTH, USERS_BUSINESS, USERS_DATABASE, USERS_VALIDATION } from './codes-users.const';
import { VEHICLES_BUSINESS, VEHICLES_DATABASE, VEHICLES_VALIDATION } from './codes-vehicles.const';

/*
  The error-code registry. Every code is five digits — `[layer][feature][sequence]` — assembled here from
  the per-feature `codes-{feature}.const.ts` files.

  Layer (1st digit): 1 Database · 2 Validation · 3 Business · 5 Auth.
  Feature (2nd digit): 0 Common · 1 Users · 2 Vehicles · 3 Scheduling · 4 Bookings · 5 Marketplace ·
    6 Orders · 7 Billing.

  Each feature namespace is added here by the step that first raises its codes, so a feature with no
  service yet has no dead code in the registry.
*/
export const CODES = {
  DATABASE: {
    COMMON: COMMON_DATABASE,
    USERS: USERS_DATABASE,
    VEHICLES: VEHICLES_DATABASE,
    SCHEDULING: SCHEDULING_DATABASE,
    BOOKINGS: BOOKINGS_DATABASE,
    MARKETPLACE: MARKETPLACE_DATABASE,
    ORDERS: ORDERS_DATABASE,
    BILLING: BILLING_DATABASE,
  },
  VALIDATION: {
    COMMON: COMMON_VALIDATION,
    USERS: USERS_VALIDATION,
    VEHICLES: VEHICLES_VALIDATION,
    SCHEDULING: SCHEDULING_VALIDATION,
    BOOKINGS: BOOKINGS_VALIDATION,
    MARKETPLACE: MARKETPLACE_VALIDATION,
    ORDERS: ORDERS_VALIDATION,
    BILLING: BILLING_VALIDATION,
  },
  BUSINESS: {
    COMMON: COMMON_BUSINESS,
    USERS: USERS_BUSINESS,
    VEHICLES: VEHICLES_BUSINESS,
    BOOKINGS: BOOKINGS_BUSINESS,
    MARKETPLACE: MARKETPLACE_BUSINESS,
    ORDERS: ORDERS_BUSINESS,
    BILLING: BILLING_BUSINESS,
  },
  AUTH: {
    COMMON: COMMON_AUTH,
    USERS: USERS_AUTH,
  },
} as const;
