import Link from 'next/link';
import { notFound } from 'next/navigation';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';
import { ProductService } from '@/lib/services';
import { formatPriceLabel } from '@/lib/utils';

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

        {/* Ordering is added in the next step; for now the detail page is the entry point it will attach to. */}
        <button
          type="button"
          disabled
          className="bg-primary text-primary-foreground w-fit cursor-not-allowed rounded-md px-4 py-2 text-sm font-semibold opacity-60">
          Order — coming soon
        </button>
      </div>

      <Link href={ROUTES.OWNER_MARKETPLACE.HREF} className="text-muted-foreground text-sm underline-offset-4 hover:underline">
        ← Back to marketplace
      </Link>
    </section>
  );
}
