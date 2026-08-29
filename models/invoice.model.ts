import mongoose, { Model, Schema, Types } from 'mongoose';

import { InvoiceStatus, InvoiceType } from '@/types';

import { INVOICE_STATUSES, INVOICE_TYPES } from '@/constants/enums.const';

export type InvoiceAttributes = {
  type: InvoiceType;
  reference: Types.ObjectId;
  owner: Types.ObjectId;
  issuedBy: Types.ObjectId;
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  issuedAt: Date;
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};
export type InvoiceEntity = InvoiceAttributes & { _id: Types.ObjectId };
type InvoiceModel = Model<InvoiceAttributes>;

const invoiceSchema = new Schema<InvoiceAttributes, InvoiceModel>(
  {
    type: { type: String, required: true, enum: Object.values(INVOICE_TYPES) },
    reference: { type: Schema.Types.ObjectId, required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, required: true, enum: Object.values(INVOICE_STATUSES), default: INVOICE_STATUSES.UNPAID },
    issuedAt: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true },
    paidAt: { type: Date },
  },
  { timestamps: true }
);
invoiceSchema.index({ owner: 1, status: 1 });
invoiceSchema.index({ type: 1 });

export const Invoice = (mongoose.models.Invoice as InvoiceModel) ?? mongoose.model<InvoiceAttributes, InvoiceModel>('Invoice', invoiceSchema);
