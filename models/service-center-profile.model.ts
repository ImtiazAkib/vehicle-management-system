import mongoose, { Model, Schema, Types } from 'mongoose';

export type ServiceCenterProfileAttributes = {
  user: Types.ObjectId;
  centerName: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  servicesOffered: string[];
  ratingAvg: number;
  ratingCount: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};
export type ServiceCenterProfileEntity = ServiceCenterProfileAttributes & { _id: Types.ObjectId };
type ServiceCenterProfileModel = Model<ServiceCenterProfileAttributes>;

const serviceCenterProfileSchema = new Schema<ServiceCenterProfileAttributes, ServiceCenterProfileModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    centerName: { type: String, required: true, trim: true, maxlength: 160 },
    address: { type: String, required: true, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 120 },
    latitude: { type: Number },
    longitude: { type: Number },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    servicesOffered: { type: [String], default: [] },
    ratingAvg: { type: Number, required: true, min: 0, default: 0 },
    ratingCount: { type: Number, required: true, min: 0, default: 0 },
    isVerified: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);
serviceCenterProfileSchema.index({ user: 1 }, { unique: true });
serviceCenterProfileSchema.index({ city: 1 });
serviceCenterProfileSchema.index({ isVerified: 1 });

export const ServiceCenterProfile =
  (mongoose.models.ServiceCenterProfile as ServiceCenterProfileModel) ??
  mongoose.model<ServiceCenterProfileAttributes, ServiceCenterProfileModel>('ServiceCenterProfile', serviceCenterProfileSchema);
