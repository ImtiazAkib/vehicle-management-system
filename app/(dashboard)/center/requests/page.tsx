import { ClipboardList } from 'lucide-react';

import { SERVICE_REQUEST_STATUSES } from '@/constants/enums.const';
import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';
import { ServiceRequestService } from '@/lib/services';
import { formatPriceLabel } from '@/lib/utils';

import { AcceptForm, CompleteForm, TransitionButton } from '@/components/bookings';
import { EmptyState, PageHeader } from '@/components/shared';

const service = new ServiceRequestService();

export default async function CenterRequestsPage() {
  const center = await requireRole(USER_ROLES.SERVICE_CENTER);
  const requests = (await service.findForCenter(center.userId)).result ?? [];

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Service requests" description="Accept, schedule, start and complete the bookings assigned to your center." />

      {requests.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No requests yet" description="Bookings owners make against your center will appear here." />
      ) : (
        <ul className="flex flex-col gap-2">
          {requests.map(request => (
            <li key={request.serviceRequestId} className="surface-card flex flex-col gap-3 p-4">
              <div>
                <p className="font-medium">{request.serviceType}</p>
                <p className="text-muted-foreground text-sm">
                  {request.status.toLowerCase().replace('_', ' ')} · {request.priority.toLowerCase()} · preferred{' '}
                  {new Date(request.preferredDate).toLocaleDateString()}
                  {request.scheduledDate ? ` · scheduled ${new Date(request.scheduledDate).toLocaleDateString()}` : ''}
                  {request.finalCost != null
                    ? ` · ${formatPriceLabel(request.finalCost)}`
                    : request.estimatedCost != null
                      ? ` · est. ${formatPriceLabel(request.estimatedCost)}`
                      : ''}
                </p>
                {request.description ? <p className="text-muted-foreground mt-1 text-sm">{request.description}</p> : null}
              </div>

              {request.status === SERVICE_REQUEST_STATUSES.PENDING && (
                <div className="flex flex-wrap items-end gap-3">
                  <AcceptForm requestId={request.serviceRequestId} />
                  <TransitionButton requestId={request.serviceRequestId} action="decline" label="Decline" />
                </div>
              )}

              {request.status === SERVICE_REQUEST_STATUSES.ACCEPTED && (
                <div className="flex flex-wrap gap-3">
                  <TransitionButton requestId={request.serviceRequestId} action="start" label="Start work" />
                </div>
              )}

              {request.status === SERVICE_REQUEST_STATUSES.IN_PROGRESS && <CompleteForm requestId={request.serviceRequestId} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
