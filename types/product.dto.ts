import { toId } from '@/lib/utils';

import type { ProductCategory } from './enums';
import type { ProductEntity } from '@/models/product.model';

export type ProductDto = {
  productId: string;
  supplierId: string;
  name: string;
  category: ProductCategory;
  sku: string;
  description?: string | null;
  price: number;
  stockQuantity: number;
  hasImage: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export function productFromEntity(entity: ProductEntity): ProductDto {
  return {
    productId: toId(entity._id),
    supplierId: toId(entity.supplier),
    name: entity.name,
    category: entity.category,
    sku: entity.sku,
    description: entity.description ?? null,
    price: entity.price,
    stockQuantity: entity.stockQuantity,
    hasImage: Boolean(entity.imageStorageKey),
    isActive: entity.isActive,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
