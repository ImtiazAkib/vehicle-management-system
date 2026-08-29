import Link from 'next/link';

import { CalendarCheck } from 'lucide-react';

import { SERVICE_REQUEST_STATUSES } from '@/constants/enums.const';
import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';
import { ServiceRequestService } from '@/lib/services';
import { formatPriceLabel } from '@/lib/utils';

import { TransitionButton } from '@/components/bookings';
import { startConversationAction } from '@/components/messages/actions';
import { EmptyState, PageHeader } from '@/components/shared';

const service = new ServiceRequestService();

const CANCELLABLE: string[] = [SERVICE_REQUEST_STATUSES.PENDING, SERVICE_REQUEST_STATUSES.ACCEPTED];

export default async function OwnerBookingsPage() {
  const owner = await requireRole(USER_ROLES.OWNER);
  const bookings = (await service.findForOwner(owner.userId)).result ?? [];

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Bookings"
        description="Book a service at a verified center and follow its progress."
        action={
          <Link
            href={ROUTES.OWNER_BOOKINGS_NEW.HREF}
            className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex rounded-md px-4 py-2 text-sm font-semibold transition-colors">
            Book a service
          </Link>
        }
      />

      {bookings.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No bookings yet"
          description="Book a service at a verified center to get started."
          action={
            <Link
              href={ROUTES.OWNER_BOOKINGS_NEW.HREF}
              className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex rounded-md px-4 py-2 text-sm font-semibold transition-colors">
              Book a service
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {bookings.map(booking => (
            <li key={booking.serviceRequestId} className="surface-card flex items-center justify-between gap-4 p-4">
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
              <div className="flex items-center gap-2">
                <form action={startConversationAction}>
                  <input type="hidden" name="serviceRequestId" value={booking.serviceRequestId} />
                  <button type="submit" className="border-border hover:bg-muted rounded-md border px-2 py-1 text-xs font-medium transition-colors">
                    Message
                  </button>
                </form>
                {CANCELLABLE.includes(booking.status) && <TransitionButton requestId={booking.serviceRequestId} action="cancel" label="Cancel" />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
