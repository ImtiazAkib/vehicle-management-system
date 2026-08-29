import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';

import { VehicleForm } from '@/components/owner';

export default async function NewVehiclePage() {
  await requireRole(USER_ROLES.OWNER);

  return (
    <section className="flex flex-col gap-4">
      <h1>Add a vehicle</h1>
      <VehicleForm />
    </section>
  );
}
