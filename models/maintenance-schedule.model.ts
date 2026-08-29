import mongoose, { Model, Schema, Types } from 'mongoose';

import { MaintenanceScheduleStatus } from '@/types';

import { MAINTENANCE_SCHEDULE_STATUSES } from '@/constants/enums.const';

export type MaintenanceScheduleAttributes = {
  vehicle: Types.ObjectId;
  serviceType: string;
  intervalMonths?: number;
  intervalMileage?: number;
  nextDueDate: Date;
  nextDueMileage?: number;
  status: MaintenanceScheduleStatus;
  lastNotifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};
export type MaintenanceScheduleEntity = MaintenanceScheduleAttributes & { _id: Types.ObjectId };
type MaintenanceScheduleModel = Model<MaintenanceScheduleAttributes>;

const maintenanceScheduleSchema = new Schema<MaintenanceScheduleAttributes, MaintenanceScheduleModel>(
  {
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    serviceType: { type: String, required: true, trim: true, maxlength: 120 },
    intervalMonths: { type: Number, min: 0 },
    intervalMileage: { type: Number, min: 0 },
    nextDueDate: { type: Date, required: true },
    nextDueMileage: { type: Number, min: 0 },
    status: { type: String, required: true, enum: Object.values(MAINTENANCE_SCHEDULE_STATUSES), default: MAINTENANCE_SCHEDULE_STATUSES.UPCOMING },
    lastNotifiedAt: { type: Date },
  },
  { timestamps: true }
);
maintenanceScheduleSchema.index({ vehicle: 1 });
maintenanceScheduleSchema.index({ status: 1, nextDueDate: 1 });

export const MaintenanceSchedule =
  (mongoose.models.MaintenanceSchedule as MaintenanceScheduleModel) ??
  mongoose.model<MaintenanceScheduleAttributes, MaintenanceScheduleModel>('MaintenanceSchedule', maintenanceScheduleSchema);
