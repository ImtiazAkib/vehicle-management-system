import mongoose, { Model, Schema, Types } from 'mongoose';

import { ProductCategory } from '@/types';

import { PRODUCT_CATEGORIES } from '@/constants/enums.const';

export type ProductAttributes = {
  supplier: Types.ObjectId;
  name: string;
  category: ProductCategory;
  sku: string;
  description?: string;
  price: number;
  stockQuantity: number;
  imageStorageKey?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
export type ProductEntity = ProductAttributes & { _id: Types.ObjectId };
type ProductModel = Model<ProductAttributes>;

const productSchema = new Schema<ProductAttributes, ProductModel>(
  {
    supplier: { type: Schema.Types.ObjectId, ref: 'SupplierProfile', required: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    category: { type: String, required: true, enum: Object.values(PRODUCT_CATEGORIES) },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 40 },
    description: { type: String, trim: true, maxlength: 2000 },
    price: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    imageStorageKey: { type: String, maxlength: 512 },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);
productSchema.index({ category: 1 });
productSchema.index({ supplier: 1 });

export const Product = (mongoose.models.Product as ProductModel) ?? mongoose.model<ProductAttributes, ProductModel>('Product', productSchema);
