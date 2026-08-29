import { requireAdminArea } from '@/lib/auth';
import { UserService } from '@/lib/services';

import { verifyServiceCenterAction, verifySupplierAction } from '@/components/admin/actions';
import { PageHeader } from '@/components/shared';

const userService = new UserService();

export default async function AdminVerificationsPage() {
  await requireAdminArea();

  const centers = (await userService.listServiceCenters(true)).result ?? [];
  const suppliers = (await userService.listSuppliers(true)).result ?? [];

  return (
    <section className="flex flex-col gap-8">
      <PageHeader title="Verifications" description="Service centers and suppliers awaiting verification. Verifying one makes it transactable." />

      <div className="flex flex-col gap-3">
        <h2>Service centers</h2>
        {centers.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing waiting.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {centers.map(center => (
              <li key={center.serviceCenterId} className="surface-card flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-medium">{center.centerName}</p>
                  <p className="text-muted-foreground text-sm">
                    {center.city} · {center.phone}
                  </p>
                </div>
                <form action={verifyServiceCenterAction}>
                  <input type="hidden" name="profileId" value={center.serviceCenterId} />
                  <button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-primary-hover rounded-md px-3 py-1.5 text-xs font-semibold">
                    Verify
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2>Suppliers</h2>
        {suppliers.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing waiting.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {suppliers.map(supplier => (
              <li key={supplier.supplierId} className="surface-card flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-medium">{supplier.businessName}</p>
                  <p className="text-muted-foreground text-sm">
                    {supplier.city} · {supplier.phone}
                  </p>
                </div>
                <form action={verifySupplierAction}>
                  <input type="hidden" name="profileId" value={supplier.supplierId} />
                  <button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-primary-hover rounded-md px-3 py-1.5 text-xs font-semibold">
                    Verify
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
