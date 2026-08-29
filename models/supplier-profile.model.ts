import mongoose, { Model, Schema, Types } from 'mongoose';

export type SupplierProfileAttributes = {
  user: Types.ObjectId;
  businessName: string;
  address: string;
  city: string;
  phone: string;
  ratingAvg: number;
  ratingCount: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};
export type SupplierProfileEntity = SupplierProfileAttributes & { _id: Types.ObjectId };
type SupplierProfileModel = Model<SupplierProfileAttributes>;

const supplierProfileSchema = new Schema<SupplierProfileAttributes, SupplierProfileModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true, trim: true, maxlength: 160 },
    address: { type: String, required: true, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    ratingAvg: { type: Number, required: true, min: 0, default: 0 },
    ratingCount: { type: Number, required: true, min: 0, default: 0 },
    isVerified: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);
supplierProfileSchema.index({ city: 1 });
supplierProfileSchema.index({ isVerified: 1 });

export const SupplierProfile =
  (mongoose.models.SupplierProfile as SupplierProfileModel) ??
  mongoose.model<SupplierProfileAttributes, SupplierProfileModel>('SupplierProfile', supplierProfileSchema);
