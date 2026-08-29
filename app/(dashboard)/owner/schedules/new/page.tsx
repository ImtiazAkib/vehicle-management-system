import Link from 'next/link';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';
import { VehicleService } from '@/lib/services';

import { ScheduleForm } from '@/components/owner';

const vehicleService = new VehicleService();

export default async function NewSchedulePage() {
  const owner = await requireRole(USER_ROLES.OWNER);
  const vehicles = (await vehicleService.list(owner.userId)).result ?? [];

  return (
    <section className="flex flex-col gap-4">
      <h1>Add a maintenance schedule</h1>

      {vehicles.length === 0 ? (
        <p className="text-muted-foreground">
          Add a vehicle first, then set up its maintenance schedule.{' '}
          <Link href={ROUTES.OWNER_VEHICLES_NEW.HREF} className="text-foreground font-medium underline-offset-4 hover:underline">
            Add a vehicle
          </Link>
        </p>
      ) : (
        <ScheduleForm vehicles={vehicles} />
      )}
    </section>
  );
}
