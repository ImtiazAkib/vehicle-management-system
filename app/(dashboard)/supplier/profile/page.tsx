import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';
import { SupplierService } from '@/lib/services';

import { PageHeader } from '@/components/shared';
import { SupplierProfileForm, VerificationBanner } from '@/components/supplier';

const supplierService = new SupplierService();

export default async function SupplierProfilePage() {
  const supplier = await requireRole(USER_ROLES.SUPPLIER);
  const result = await supplierService.getOwnProfile(supplier.userId);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Supplier profile" description="The business details buyers see. Verification status is set by an administrator." />

      {result.success && result.result ? (
        <>
          <VerificationBanner isVerified={result.result.isVerified} />
          <SupplierProfileForm profile={result.result} />
        </>
      ) : (
        <p className="text-muted-foreground">Your supplier profile is not available yet.</p>
      )}
    </section>
  );
}
