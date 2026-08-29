import Link from 'next/link';

import { Package } from 'lucide-react';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';
import { ProductService, SupplierService } from '@/lib/services';
import { formatPriceLabel } from '@/lib/utils';

import { setProductActiveAction } from '@/components/marketplace/actions';
import { EmptyState, PageHeader } from '@/components/shared';
import { VerificationBanner } from '@/components/supplier';

const productService = new ProductService();
const supplierService = new SupplierService();

const categoryLabel = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

export default async function SupplierProductsPage() {
  const supplier = await requireRole(USER_ROLES.SUPPLIER);

  const [productsResult, profileResult] = await Promise.all([
    productService.listForSupplier(supplier.userId),
    supplierService.getOwnProfile(supplier.userId),
  ]);

  const products = productsResult.result ?? [];
  const isVerified = profileResult.result?.isVerified ?? false;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Products"
        description="Your catalog. Buyers see active listings once your business is verified."
        action={
          <Link
            href={ROUTES.SUPPLIER_PRODUCTS_NEW.HREF}
            className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex rounded-md px-4 py-2 text-sm font-semibold transition-colors">
            Add a product
          </Link>
        }
      />

      <VerificationBanner isVerified={isVerified} />

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="List your first part or consumable to start selling."
          action={
            <Link
              href={ROUTES.SUPPLIER_PRODUCTS_NEW.HREF}
              className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex rounded-md px-4 py-2 text-sm font-semibold transition-colors">
              Add a product
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {products.map(product => (
            <li key={product.productId} className="surface-card flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-medium">
                  {product.name}
                  {!product.isActive && <span className="text-muted-foreground ml-2 text-xs">(inactive)</span>}
                </p>
                <p className="text-muted-foreground text-sm">
                  {categoryLabel(product.category)} · {product.sku} · {formatPriceLabel(product.price)} · {product.stockQuantity} in stock
                </p>
              </div>
              <form action={setProductActiveAction}>
                <input type="hidden" name="productId" value={product.productId} />
                <input type="hidden" name="isActive" value={product.isActive ? 'false' : 'true'} />
                <button type="submit" className="border-border hover:bg-muted rounded-md border px-3 py-1.5 text-xs font-medium transition-colors">
                  {product.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
