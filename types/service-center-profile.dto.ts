import { toId } from '@/lib/utils';

import type { ServiceCenterProfileEntity } from '@/models/service-center-profile.model';

export type ServiceCenterProfileDto = {
  serviceCenterId: string;
  userId: string;
  centerName: string;
  address: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  phone: string;
  servicesOffered: string[];
  ratingAvg: number;
  ratingCount: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export function serviceCenterProfileFromEntity(entity: ServiceCenterProfileEntity): ServiceCenterProfileDto {
  return {
    serviceCenterId: toId(entity._id),
    userId: toId(entity.user),
    centerName: entity.centerName,
    address: entity.address,
    city: entity.city,
    latitude: entity.latitude ?? null,
    longitude: entity.longitude ?? null,
    phone: entity.phone,
    servicesOffered: entity.servicesOffered,
    ratingAvg: entity.ratingAvg,
    ratingCount: entity.ratingCount,
    isVerified: entity.isVerified,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
