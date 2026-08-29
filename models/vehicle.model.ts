import mongoose, { Model, Schema, Types } from 'mongoose';

import { FuelType, Transmission } from '@/types';

import { FUEL_TYPES, TRANSMISSIONS } from '@/constants/enums.const';

export type VehicleAttributes = {
  owner: Types.ObjectId;
  make: string;
  model: string;
  year: number;
  vin: string;
  registrationNo: string;
  color?: string;
  fuelType: FuelType;
  transmission: Transmission;
  currentMileage: number;
  imageStorageKey?: string;
  purchaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
};
export type VehicleEntity = VehicleAttributes & { _id: Types.ObjectId };
type VehicleModel = Model<VehicleAttributes>;

const vehicleSchema = new Schema<VehicleAttributes, VehicleModel>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    make: { type: String, required: true, trim: true, maxlength: 60 },
    model: { type: String, required: true, trim: true, maxlength: 60 },
    year: { type: Number, required: true, min: 1900, max: 2100 },
    vin: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 32 },
    registrationNo: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 32 },
    color: { type: String, trim: true, maxlength: 40 },
    fuelType: { type: String, required: true, enum: Object.values(FUEL_TYPES) },
    transmission: { type: String, required: true, enum: Object.values(TRANSMISSIONS) },
    currentMileage: { type: Number, required: true, min: 0, default: 0 },
    imageStorageKey: { type: String, maxlength: 512 },
    purchaseDate: { type: Date },
  },
  { timestamps: true }
);
vehicleSchema.index({ owner: 1 });

export const Vehicle = (mongoose.models.Vehicle as VehicleModel) ?? mongoose.model<VehicleAttributes, VehicleModel>('Vehicle', vehicleSchema);
