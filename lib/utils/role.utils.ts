import { USER_ROLE_LABELS } from '@/constants/roles.const';

import type { UserRole } from '@/types';

/**
 * The human label for a role — `Vehicle owner`, `Service center`. One source, so a label change lands in
 * one place rather than in every screen that prints it.
 *
 * @param role - The role to label.
 *
 * @returns The display label.
 */
export function resolveRoleLabel(role: UserRole): string {
  return USER_ROLE_LABELS[role];
}

/*
  One accent per role area, matching the design tokens: admin violet, owner blue, service center teal,
  supplier amber. The super administrator borrows the admin accent — it is their area too.
*/
const ROLE_ACCENT_CLASS: Record<UserRole, string> = {
  'super-admin': 'text-accent-violet',
  admin: 'text-accent-violet',
  owner: 'text-accent-blue',
  'service-center': 'text-accent-teal',
  supplier: 'text-accent-amber',
};

/**
 * The accent text class for a role. Color is a role signal here, not decoration.
 *
 * @param role - The role to color.
 *
 * @returns A Tailwind text-color class.
 */
export function roleAccentClassName(role: UserRole): string {
  return ROLE_ACCENT_CLASS[role];
}

/**
 * Up to two initials from a name, for the avatar chip. Falls back to `?` for an empty name so the chip is
 * never blank.
 *
 * @param name - The person's name.
 *
 * @returns One or two uppercase initials.
 */
export function resolveInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('');

  return initials || '?';
}
