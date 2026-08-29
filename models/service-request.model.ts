import mongoose, { Model, Schema, Types } from 'mongoose';

import { ServiceRequestPriority, ServiceRequestStatus } from '@/types';

import { SERVICE_REQUEST_PRIORITIES, SERVICE_REQUEST_STATUSES } from '@/constants/enums.const';

export type ServiceRequestAttributes = {
  vehicle: Types.ObjectId;
  owner: Types.ObjectId;
  serviceCenter: Types.ObjectId;
  serviceType: string;
  description?: string;
  priority: ServiceRequestPriority;
  preferredDate: Date;
  scheduledDate?: Date;
  status: ServiceRequestStatus;
  estimatedCost?: number;
  finalCost?: number;
  createdAt: Date;
  updatedAt: Date;
};
export type ServiceRequestEntity = ServiceRequestAttributes & { _id: Types.ObjectId };
type ServiceRequestModel = Model<ServiceRequestAttributes>;

const serviceRequestSchema = new Schema<ServiceRequestAttributes, ServiceRequestModel>(
  {
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    serviceCenter: { type: Schema.Types.ObjectId, ref: 'ServiceCenterProfile', required: true },
    serviceType: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000 },
    priority: { type: String, required: true, enum: Object.values(SERVICE_REQUEST_PRIORITIES), default: SERVICE_REQUEST_PRIORITIES.NORMAL },
    preferredDate: { type: Date, required: true },
    scheduledDate: { type: Date },
    status: { type: String, required: true, enum: Object.values(SERVICE_REQUEST_STATUSES), default: SERVICE_REQUEST_STATUSES.PENDING },
    estimatedCost: { type: Number, min: 0 },
    finalCost: { type: Number, min: 0 },
  },
  { timestamps: true }
);
serviceRequestSchema.index({ serviceCenter: 1, status: 1 });
serviceRequestSchema.index({ owner: 1, status: 1 });
serviceRequestSchema.index({ vehicle: 1 });

export const ServiceRequest =
  (mongoose.models.ServiceRequest as ServiceRequestModel) ??
  mongoose.model<ServiceRequestAttributes, ServiceRequestModel>('ServiceRequest', serviceRequestSchema);
