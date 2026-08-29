import { toId } from '@/lib/utils';

import type { MaintenanceRecordEntity } from '@/models/maintenance-record.model';

export type MaintenanceRecordDto = {
  recordId: string;
  vehicleId: string;
  serviceRequestId?: string | null;
  serviceCenterId?: string | null;
  serviceType: string;
  description?: string | null;
  mileageAtService: number;
  cost: number;
  performedOn: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function maintenanceRecordFromEntity(entity: MaintenanceRecordEntity): MaintenanceRecordDto {
  return {
    recordId: toId(entity._id),
    vehicleId: toId(entity.vehicle),
    serviceRequestId: entity.serviceRequest ? toId(entity.serviceRequest) : null,
    serviceCenterId: entity.serviceCenter ? toId(entity.serviceCenter) : null,
    serviceType: entity.serviceType,
    description: entity.description ?? null,
    mileageAtService: entity.mileageAtService,
    cost: entity.cost,
    performedOn: entity.performedOn.toISOString(),
    notes: entity.notes ?? null,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
