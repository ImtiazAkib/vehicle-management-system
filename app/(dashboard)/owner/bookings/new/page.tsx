import Link from 'next/link';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';
import { ServiceRequestService, VehicleService } from '@/lib/services';

import { BookingCreateForm } from '@/components/bookings';

const vehicleService = new VehicleService();
const service = new ServiceRequestService();

export default async function NewBookingPage() {
  const owner = await requireRole(USER_ROLES.OWNER);

  const [vehicles, centers] = await Promise.all([vehicleService.list(owner.userId), service.listVerifiedCenters()]);
  const ownerVehicles = vehicles.result ?? [];
  const verifiedCenters = centers.result ?? [];

  return (
    <section className="flex flex-col gap-4">
      <h1>Book a service</h1>

      {ownerVehicles.length === 0 ? (
        <p className="text-muted-foreground">
          Add a vehicle first, then book a service for it.{' '}
          <Link href={ROUTES.OWNER_VEHICLES_NEW.HREF} className="text-foreground font-medium underline-offset-4 hover:underline">
            Add a vehicle
          </Link>
        </p>
      ) : verifiedCenters.length === 0 ? (
        <p className="text-muted-foreground">No verified service centers are available yet. Check back once a center has been approved.</p>
      ) : (
        <BookingCreateForm vehicles={ownerVehicles} centers={verifiedCenters} />
      )}
    </section>
  );
}
