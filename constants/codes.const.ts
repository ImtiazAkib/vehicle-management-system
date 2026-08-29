import { COMMON_AUTH, COMMON_BUSINESS, COMMON_DATABASE, COMMON_VALIDATION } from './codes-common.const';

/*
  The error-code registry. Every code is five digits — `[layer][feature][sequence]` — assembled here from
  the per-feature `codes-{feature}.const.ts` files.

  Layer (1st digit): 1 Database · 2 Validation · 3 Business · 5 Auth.
  Feature (2nd digit): 0 Common · 1 Users · 2 Vehicles · 3 Scheduling · 4 Bookings · 5 Marketplace ·
    6 Orders · 7 Billing.

  Each feature namespace is added here by the step that first raises its codes, so a feature with no
  service yet has no dead code in the registry. Only Common exists at step 1.
*/
export const CODES = {
  DATABASE: {
    COMMON: COMMON_DATABASE,
  },
  VALIDATION: {
    COMMON: COMMON_VALIDATION,
  },
  BUSINESS: {
    COMMON: COMMON_BUSINESS,
  },
  AUTH: {
    COMMON: COMMON_AUTH,
  },
} as const;
