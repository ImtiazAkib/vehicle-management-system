import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';

import { PageHeader } from '@/components/shared';

export default async function SupplierHomePage() {
  const user = await requireRole(USER_ROLES.SUPPLIER);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title={`Welcome, ${user.name}`}
        description="Your product catalog, stock and incoming orders land here across the marketplace and orders steps."
      />
    </section>
  );
}
