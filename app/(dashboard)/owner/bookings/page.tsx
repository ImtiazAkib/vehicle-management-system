import Link from 'next/link';

import { SERVICE_REQUEST_STATUSES } from '@/constants/enums.const';
import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';
import { ServiceRequestService } from '@/lib/services';
import { formatPriceLabel } from '@/lib/utils';

import { TransitionButton } from '@/components/bookings';

const service = new ServiceRequestService();

const CANCELLABLE: string[] = [SERVICE_REQUEST_STATUSES.PENDING, SERVICE_REQUEST_STATUSES.ACCEPTED];

export default async function OwnerBookingsPage() {
  const owner = await requireRole(USER_ROLES.OWNER);
  const bookings = (await service.findForOwner(owner.userId)).result ?? [];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1>Bookings</h1>
        <Link
          href={ROUTES.OWNER_BOOKINGS_NEW.HREF}
          className="bg-primary text-primary-foreground hover:bg-primary-hover rounded-md px-4 py-2 text-sm font-semibold">
          Book a service
        </Link>
      </div>

      {bookings.length === 0 ? (
        <p className="text-muted-foreground">No bookings yet. Book a service at a verified center to get started.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {bookings.map(booking => (
            <li key={booking.serviceRequestId} className="border-border flex items-center justify-between gap-4 rounded-md border p-3">
              <div>
                <p className="font-medium">{booking.serviceType}</p>
                <p className="text-muted-foreground text-sm">
                  {booking.status.toLowerCase().replace('_', ' ')} · {booking.priority.toLowerCase()} · preferred{' '}
                  {new Date(booking.preferredDate).toLocaleDateString()}
                  {booking.scheduledDate ? ` · scheduled ${new Date(booking.scheduledDate).toLocaleDateString()}` : ''}
                  {booking.finalCost != null
                    ? ` · ${formatPriceLabel(booking.finalCost)}`
                    : booking.estimatedCost != null
                      ? ` · est. ${formatPriceLabel(booking.estimatedCost)}`
                      : ''}
                </p>
              </div>
              {CANCELLABLE.includes(booking.status) && <TransitionButton requestId={booking.serviceRequestId} action="cancel" label="Cancel" />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
