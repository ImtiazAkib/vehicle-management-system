import mongoose, { Model, Schema, Types } from 'mongoose';

import { OrderPaymentStatus, OrderStatus } from '@/types';

import { ORDER_PAYMENT_STATUSES, ORDER_STATUSES } from '@/constants/enums.const';

export type ShippingAddress = {
  line1: string;
  line2?: string;
  city: string;
  postalCode?: string;
  phone?: string;
};

export type OrderAttributes = {
  buyer: Types.ObjectId;
  supplier: Types.ObjectId;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  tax: number;
  totalAmount: number;
  shippingAddress: ShippingAddress;
  paymentStatus: OrderPaymentStatus;
  placedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderEntity = OrderAttributes & { _id: Types.ObjectId };
type OrderModel = Model<OrderAttributes>;

const shippingAddressSchema = new Schema<ShippingAddress>(
  {
    line1: { type: String, required: true, maxlength: 200 },
    line2: { type: String, maxlength: 200 },
    city: { type: String, required: true, maxlength: 120 },
    postalCode: { type: String, maxlength: 20 },
    phone: { type: String, maxlength: 40 },
  },
  { _id: false }
);

const orderSchema = new Schema<OrderAttributes, OrderModel>(
  {
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    supplier: { type: Schema.Types.ObjectId, ref: 'SupplierProfile', required: true },
    status: { type: String, required: true, enum: Object.values(ORDER_STATUSES), default: ORDER_STATUSES.PENDING },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentStatus: { type: String, required: true, enum: Object.values(ORDER_PAYMENT_STATUSES), default: ORDER_PAYMENT_STATUSES.UNPAID },
    placedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

orderSchema.index({ buyer: 1, status: 1 });
orderSchema.index({ supplier: 1, status: 1 });

export const Order = (mongoose.models.Order as OrderModel) ?? mongoose.model<OrderAttributes, OrderModel>('Order', orderSchema);
