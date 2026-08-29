import mongoose, { Model, Schema, Types } from 'mongoose';

export type OrderItemAttributes = {
  order: Types.ObjectId;
  product: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
};
export type OrderItemEntity = OrderItemAttributes & { _id: Types.ObjectId };
type OrderItemModel = Model<OrderItemAttributes>;

const orderItemSchema = new Schema<OrderItemAttributes, OrderItemModel>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);
orderItemSchema.index({ order: 1 });

export const OrderItem =
  (mongoose.models.OrderItem as OrderItemModel) ?? mongoose.model<OrderItemAttributes, OrderItemModel>('OrderItem', orderItemSchema);
