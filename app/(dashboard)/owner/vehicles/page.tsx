import Link from 'next/link';

import { Car } from 'lucide-react';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';
import { VehicleService } from '@/lib/services';

import { deleteVehicleAction } from '@/components/owner/actions';
import { EmptyState, PageHeader } from '@/components/shared';

const vehicleService = new VehicleService();

export default async function OwnerVehiclesPage() {
  const owner = await requireRole(USER_ROLES.OWNER);
  const vehicles = (await vehicleService.list(owner.userId)).result ?? [];

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="My vehicles"
        description="Register a vehicle and track its details and maintenance."
        action={
          <Link
            href={ROUTES.OWNER_VEHICLES_NEW.HREF}
            className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex rounded-md px-4 py-2 text-sm font-semibold transition-colors">
            Add a vehicle
          </Link>
        }
      />

      {vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No vehicles yet"
          description="Add your first vehicle to start tracking its mileage and maintenance."
          action={
            <Link
              href={ROUTES.OWNER_VEHICLES_NEW.HREF}
              className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex rounded-md px-4 py-2 text-sm font-semibold transition-colors">
              Add a vehicle
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {vehicles.map(vehicle => (
            <li key={vehicle.vehicleId} className="surface-card flex items-center justify-between gap-4 p-4">
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
                <button type="submit" className="border-border hover:bg-muted rounded-md border px-3 py-1.5 text-xs font-medium transition-colors">
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
