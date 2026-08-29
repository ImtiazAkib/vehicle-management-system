import mongoose, { Model, Schema, Types } from 'mongoose';

import { PaymentMethod, PaymentStatus } from '@/types';

import { PAYMENT_METHODS, PAYMENT_STATUSES } from '@/constants/enums.const';

export type PaymentAttributes = {
  invoice: Types.ObjectId;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};
export type PaymentEntity = PaymentAttributes & { _id: Types.ObjectId };
type PaymentModel = Model<PaymentAttributes>;

const paymentSchema = new Schema<PaymentAttributes, PaymentModel>(
  {
    invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, required: true, enum: Object.values(PAYMENT_METHODS) },
    status: { type: String, required: true, enum: Object.values(PAYMENT_STATUSES), default: PAYMENT_STATUSES.PENDING },
    transactionRef: { type: String, trim: true, maxlength: 200 },
    paidAt: { type: Date },
  },
  { timestamps: true }
);
paymentSchema.index({ invoice: 1 });

export const Payment = (mongoose.models.Payment as PaymentModel) ?? mongoose.model<PaymentAttributes, PaymentModel>('Payment', paymentSchema);
