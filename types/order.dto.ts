import { toId } from '@/lib/utils';

import type { OrderPaymentStatus, OrderStatus } from './enums';
import type { OrderEntity } from '@/models/order.model';

export type OrderDto = {
  orderId: string;
  buyerId: string;
  supplierId: string;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  tax: number;
  totalAmount: number;
  paymentStatus: OrderPaymentStatus;
  shippingAddress: {
    line1: string;
    line2?: string | null;
    city: string;
    postalCode?: string | null;
    phone?: string | null;
  };
  placedAt: string;
  createdAt: string;
  updatedAt: string;
};

export function orderFromEntity(entity: OrderEntity): OrderDto {
  return {
    orderId: toId(entity._id),
    buyerId: toId(entity.buyer),
    supplierId: toId(entity.supplier),
    status: entity.status,
    subtotal: entity.subtotal,
    shippingFee: entity.shippingFee,
    tax: entity.tax,
    totalAmount: entity.totalAmount,
    paymentStatus: entity.paymentStatus,
    shippingAddress: {
      line1: entity.shippingAddress.line1,
      line2: entity.shippingAddress.line2 ?? null,
      city: entity.shippingAddress.city,
      postalCode: entity.shippingAddress.postalCode ?? null,
      phone: entity.shippingAddress.phone ?? null,
    },
    placedAt: entity.placedAt.toISOString(),
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
