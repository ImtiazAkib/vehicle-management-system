import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';

export default async function SupplierHomePage() {
  const user = await requireRole(USER_ROLES.SUPPLIER);

  return (
    <section className="flex flex-col gap-2">
      <h1>Supplier</h1>
      <p className="text-muted-foreground">Welcome, {user.name}. Your product catalog, stock and incoming orders land here across steps 11 and 12.</p>
    </section>
  );
}
