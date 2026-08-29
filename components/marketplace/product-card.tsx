import type { Route } from 'next';

import Link from 'next/link';

import { formatPriceLabel } from '@/lib/utils';

import type { ProductDto } from '@/types';

const categoryLabel = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

/** A single product in the browse grid — name, category, price and stock, linking to its detail page. */
export function ProductCard({ product }: { product: ProductDto }) {
  return (
    <Link href={`/owner/marketplace/${product.productId}` as Route} className="surface-card hover:bg-muted flex flex-col gap-2 p-4 transition-colors">
      <span className="font-medium">{product.name}</span>
      <span className="bg-muted text-muted-foreground w-fit rounded-full px-2 py-0.5 text-xs">{categoryLabel(product.category)}</span>
      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <span className="font-semibold">{formatPriceLabel(product.price)}</span>
        <span className="text-muted-foreground text-xs">{product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}</span>
      </div>
    </Link>
  );
}
