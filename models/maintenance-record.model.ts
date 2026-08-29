import mongoose, { Model, Schema, Types } from 'mongoose';

export type MaintenanceRecordAttributes = {
  vehicle: Types.ObjectId;
  serviceRequest?: Types.ObjectId;
  serviceCenter?: Types.ObjectId;
  serviceType: string;
  description?: string;
  mileageAtService: number;
  cost: number;
  performedOn: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};
export type MaintenanceRecordEntity = MaintenanceRecordAttributes & { _id: Types.ObjectId };
type MaintenanceRecordModel = Model<MaintenanceRecordAttributes>;

const maintenanceRecordSchema = new Schema<MaintenanceRecordAttributes, MaintenanceRecordModel>(
  {
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    serviceRequest: { type: Schema.Types.ObjectId, ref: 'ServiceRequest' },
    serviceCenter: { type: Schema.Types.ObjectId, ref: 'ServiceCenterProfile' },
    serviceType: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000 },
    mileageAtService: { type: Number, required: true, min: 0 },
    cost: { type: Number, required: true, min: 0 },
    performedOn: { type: Date, required: true },
    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);
maintenanceRecordSchema.index({ vehicle: 1, performedOn: -1 });

export const MaintenanceRecord =
  (mongoose.models.MaintenanceRecord as MaintenanceRecordModel) ??
  mongoose.model<MaintenanceRecordAttributes, MaintenanceRecordModel>('MaintenanceRecord', maintenanceRecordSchema);
