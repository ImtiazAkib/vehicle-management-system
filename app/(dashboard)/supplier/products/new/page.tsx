import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';
import { SupplierService } from '@/lib/services';

import { ProductForm } from '@/components/marketplace';
import { PageHeader } from '@/components/shared';
import { VerificationBanner } from '@/components/supplier';

const supplierService = new SupplierService();

export default async function NewProductPage() {
  const supplier = await requireRole(USER_ROLES.SUPPLIER);
  const isVerified = (await supplierService.getOwnProfile(supplier.userId)).result?.isVerified ?? false;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Add a product" description="List a part or consumable for buyers to find." />

      <VerificationBanner isVerified={isVerified} />

      <ProductForm />
    </section>
  );
}
