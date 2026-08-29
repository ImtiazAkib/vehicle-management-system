import { toId } from '@/lib/utils';

import type { FuelType, Transmission } from './enums';
import type { VehicleEntity } from '@/models/vehicle.model';

export type VehicleDto = {
  vehicleId: string;
  ownerId: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  registrationNo: string;
  color?: string | null;
  fuelType: FuelType;
  transmission: Transmission;
  currentMileage: number;
  hasImage: boolean;
  purchaseDate?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function vehicleFromEntity(entity: VehicleEntity): VehicleDto {
  return {
    vehicleId: toId(entity._id),
    ownerId: toId(entity.owner),
    make: entity.make,
    model: entity.model,
    year: entity.year,
    vin: entity.vin,
    registrationNo: entity.registrationNo,
    color: entity.color ?? null,
    fuelType: entity.fuelType,
    transmission: entity.transmission,
    currentMileage: entity.currentMileage,
    hasImage: Boolean(entity.imageStorageKey),
    purchaseDate: entity.purchaseDate ? entity.purchaseDate.toISOString() : null,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
