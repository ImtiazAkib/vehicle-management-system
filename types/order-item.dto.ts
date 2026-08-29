import { toId } from '@/lib/utils';

import type { OrderItemEntity } from '@/models/order-item.model';

export type OrderItemDto = {
  orderItemId: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
};

export function orderItemFromEntity(entity: OrderItemEntity): OrderItemDto {
  return {
    orderItemId: toId(entity._id),
    orderId: toId(entity.order),
    productId: toId(entity.product),
    quantity: entity.quantity,
    unitPrice: entity.unitPrice,
    subtotal: entity.subtotal,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
