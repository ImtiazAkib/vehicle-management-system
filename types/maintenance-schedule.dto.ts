import { toId } from '@/lib/utils';

import type { MaintenanceScheduleStatus } from './enums';
import type { MaintenanceScheduleEntity } from '@/models/maintenance-schedule.model';

export type MaintenanceScheduleDto = {
  scheduleId: string;
  vehicleId: string;
  serviceType: string;
  intervalMonths?: number | null;
  intervalMileage?: number | null;
  nextDueDate: string;
  nextDueMileage?: number | null;
  status: MaintenanceScheduleStatus;
  lastNotifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function maintenanceScheduleFromEntity(entity: MaintenanceScheduleEntity): MaintenanceScheduleDto {
  return {
    scheduleId: toId(entity._id),
    vehicleId: toId(entity.vehicle),
    serviceType: entity.serviceType,
    intervalMonths: entity.intervalMonths ?? null,
    intervalMileage: entity.intervalMileage ?? null,
    nextDueDate: entity.nextDueDate.toISOString(),
    nextDueMileage: entity.nextDueMileage ?? null,
    status: entity.status,
    lastNotifiedAt: entity.lastNotifiedAt ? entity.lastNotifiedAt.toISOString() : null,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
