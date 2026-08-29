import Link from 'next/link';
import { notFound } from 'next/navigation';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';
import { ProductService } from '@/lib/services';
import { formatPriceLabel } from '@/lib/utils';

import { CheckoutForm } from '@/components/marketplace';
import { PageHeader } from '@/components/shared';

const productService = new ProductService();

type Params = Promise<{ productId: string }>;

const categoryLabel = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

export default async function ProductDetailPage({ params }: { params: Params }) {
  await requireRole(USER_ROLES.OWNER);

  const { productId } = await params;
  const result = await productService.getPublicProduct(productId);

  if (!result.success || !result.result) {
    notFound();
  }

  const product = result.result;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={product.name} description={`${categoryLabel(product.category)} · ${product.sku}`} />

      <div className="surface-card flex max-w-2xl flex-col gap-4 p-6">
        <p className="text-2xl font-semibold">{formatPriceLabel(product.price)}</p>
        <p className="text-muted-foreground text-sm">{product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}</p>
        {product.description && <p className="text-sm">{product.description}</p>}

        {product.stockQuantity > 0 ? (
          <div className="border-border mt-2 border-t pt-4">
            <CheckoutForm productId={product.productId} supplierId={product.supplierId} maxQuantity={product.stockQuantity} />
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">This product is out of stock right now.</p>
        )}
      </div>

      <Link href={ROUTES.OWNER_MARKETPLACE.HREF} className="text-muted-foreground text-sm underline-offset-4 hover:underline">
        ← Back to marketplace
      </Link>
    </section>
  );
}
