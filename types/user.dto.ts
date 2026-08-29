import { toId } from '@/lib/utils';

import type { UserRole } from './user-role';
import type { UserEntity } from '@/models/user.model';

export type UserDto = {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  isApproved: boolean;
  isActive: boolean;
  emailVerified: boolean;
  pendingEmail?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function userFromEntity(entity: UserEntity): UserDto {
  return {
    userId: toId(entity._id),
    name: entity.name,
    email: entity.email,
    role: entity.role,
    isApproved: entity.isApproved,
    isActive: entity.isActive,
    emailVerified: entity.emailVerified,
    pendingEmail: entity.pendingEmail ?? null,
    phone: entity.phone ?? null,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
