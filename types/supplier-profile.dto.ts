import { toId } from '@/lib/utils';

import type { SupplierProfileEntity } from '@/models/supplier-profile.model';

export type SupplierProfileDto = {
  supplierId: string;
  userId: string;
  businessName: string;
  address: string;
  city: string;
  phone: string;
  ratingAvg: number;
  ratingCount: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export function supplierProfileFromEntity(entity: SupplierProfileEntity): SupplierProfileDto {
  return {
    supplierId: toId(entity._id),
    userId: toId(entity.user),
    businessName: entity.businessName,
    address: entity.address,
    city: entity.city,
    phone: entity.phone,
    ratingAvg: entity.ratingAvg,
    ratingCount: entity.ratingCount,
    isVerified: entity.isVerified,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
