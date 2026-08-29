import { UserRole } from '@/types';

export const USER_ROLES = {
  SUPER_ADMIN: 'super-admin',
  ADMIN: 'admin',
  OWNER: 'owner',
  SERVICE_CENTER: 'service-center',
  SUPPLIER: 'supplier',
} as const satisfies Record<string, UserRole>;

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  'super-admin': 'Super administrator',
  admin: 'Administrator',
  owner: 'Vehicle owner',
  'service-center': 'Service center',
  supplier: 'Supplier',
};

/**
 * The roles that may enter the admin area.
 *
 * The super administrator holds every administrator power and then some, so the guard asks "may this
 * account be here" rather than "is this account an administrator" — `requireRole(ADMIN)` would turn the
 * one account that owns the area away from it.
 */
export const ADMIN_AREA_ROLES = [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN] as const satisfies readonly UserRole[];

/**
 * The three business roles that self-register and, once verified, transact across the platform. An
 * `admin` is created only by the super administrator; the super administrator itself is seeded.
 */
export const BUSINESS_ROLES = [USER_ROLES.OWNER, USER_ROLES.SERVICE_CENTER, USER_ROLES.SUPPLIER] as const satisfies readonly UserRole[];

/**
 * The roles whose account becomes transactable only after an administrator verifies its profile. An
 * owner is usable on email verification alone; a service center or supplier is not.
 */
export const ADMIN_VERIFIED_ROLES = [USER_ROLES.SERVICE_CENTER, USER_ROLES.SUPPLIER] as const satisfies readonly UserRole[];
