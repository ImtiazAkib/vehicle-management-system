import { toId } from '@/lib/utils';

import type { ServiceRequestPriority, ServiceRequestStatus } from './enums';
import type { ServiceRequestEntity } from '@/models/service-request.model';

export type ServiceRequestDto = {
  serviceRequestId: string;
  vehicleId: string;
  ownerId: string;
  serviceCenterId: string;
  serviceType: string;
  description?: string | null;
  priority: ServiceRequestPriority;
  preferredDate: string;
  scheduledDate?: string | null;
  status: ServiceRequestStatus;
  estimatedCost?: number | null;
  finalCost?: number | null;
  createdAt: string;
  updatedAt: string;
};

export function serviceRequestFromEntity(entity: ServiceRequestEntity): ServiceRequestDto {
  return {
    serviceRequestId: toId(entity._id),
    vehicleId: toId(entity.vehicle),
    ownerId: toId(entity.owner),
    serviceCenterId: toId(entity.serviceCenter),
    serviceType: entity.serviceType,
    description: entity.description ?? null,
    priority: entity.priority,
    preferredDate: entity.preferredDate.toISOString(),
    scheduledDate: entity.scheduledDate ? entity.scheduledDate.toISOString() : null,
    status: entity.status,
    estimatedCost: entity.estimatedCost ?? null,
    finalCost: entity.finalCost ?? null,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
