import type { Route } from 'next';

import Link from 'next/link';

import { PackageSearch } from 'lucide-react';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';
import { ProductBrowseSchema } from '@/lib/schemas';
import { PRODUCT_PAGE_SIZE, ProductService } from '@/lib/services';

import { ProductCard, ProductFilters } from '@/components/marketplace';
import { EmptyState, PageHeader } from '@/components/shared';

const productService = new ProductService();

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const asString = (value: string | string[] | undefined): string | undefined => (typeof value === 'string' ? value : undefined);

/** Build a marketplace URL that preserves the active filters and points at a given page. */
function pageHref(raw: Record<string, string | string[] | undefined>, page: number): Route {
  const params = new URLSearchParams();

  for (const key of ['category', 'q', 'minPrice', 'maxPrice'] as const) {
    const value = asString(raw[key]);
    if (value) {
      params.set(key, value);
    }
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const queryString = params.toString();

  return (queryString ? `${ROUTES.OWNER_MARKETPLACE.HREF}?${queryString}` : ROUTES.OWNER_MARKETPLACE.HREF) as Route;
}

export default async function MarketplacePage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(USER_ROLES.OWNER);

  const raw = await searchParams;
  const query = ProductBrowseSchema.parse(raw);
  const products = (await productService.browse(query)).result ?? [];

  const hasPrev = query.page > 1;
  const hasNext = products.length === PRODUCT_PAGE_SIZE;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Marketplace" description="Parts and consumables from verified suppliers." />

      <ProductFilters category={asString(raw.category)} q={asString(raw.q)} minPrice={asString(raw.minPrice)} maxPrice={asString(raw.maxPrice)} />

      {products.length === 0 ? (
        <EmptyState icon={PackageSearch} title="No products found" description="Try a different search, or clear the filters." />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map(product => (
              <ProductCard key={product.productId} product={product} />
            ))}
          </div>

          {(hasPrev || hasNext) && (
            <div className="flex items-center justify-between gap-4">
              {hasPrev ? (
                <Link
                  href={pageHref(raw, query.page - 1)}
                  className="border-border hover:bg-muted rounded-md border px-4 py-2 text-sm font-medium transition-colors">
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-muted-foreground text-sm">Page {query.page}</span>
              {hasNext ? (
                <Link
                  href={pageHref(raw, query.page + 1)}
                  className="border-border hover:bg-muted rounded-md border px-4 py-2 text-sm font-medium transition-colors">
                  Next
                </Link>
              ) : (
                <span />
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
