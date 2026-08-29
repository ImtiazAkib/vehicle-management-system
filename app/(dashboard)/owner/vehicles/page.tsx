import Link from 'next/link';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';
import { VehicleService } from '@/lib/services';

import { deleteVehicleAction } from '@/components/owner/actions';

const vehicleService = new VehicleService();

export default async function OwnerVehiclesPage() {
  const owner = await requireRole(USER_ROLES.OWNER);
  const vehicles = (await vehicleService.list(owner.userId)).result ?? [];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1>My vehicles</h1>
        <Link
          href={ROUTES.OWNER_VEHICLES_NEW.HREF}
          className="bg-primary text-primary-foreground hover:bg-primary-hover rounded-md px-4 py-2 text-sm font-semibold">
          Add a vehicle
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <p className="text-muted-foreground">No vehicles yet. Add your first one to start tracking its maintenance.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {vehicles.map(vehicle => (
            <li key={vehicle.vehicleId} className="border-border flex items-center justify-between gap-4 rounded-md border p-3">
              <div>
                <p className="font-medium">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </p>
                <p className="text-muted-foreground text-sm">
                  {vehicle.registrationNo} · {vehicle.currentMileage.toLocaleString()} km · {vehicle.fuelType.toLowerCase()}
                </p>
              </div>
              <form action={deleteVehicleAction}>
                <input type="hidden" name="vehicleId" value={vehicle.vehicleId} />
                <button type="submit" className="border-border hover:bg-muted rounded-md border px-2 py-1 text-xs font-medium">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
