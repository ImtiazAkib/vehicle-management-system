import { SERVICE_REQUEST_STATUSES } from '@/constants/enums.const';
import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';
import { ServiceRequestService } from '@/lib/services';
import { formatPriceLabel } from '@/lib/utils';

import { AcceptForm, CompleteForm, TransitionButton } from '@/components/bookings';

const service = new ServiceRequestService();

export default async function CenterRequestsPage() {
  const center = await requireRole(USER_ROLES.SERVICE_CENTER);
  const requests = (await service.findForCenter(center.userId)).result ?? [];

  return (
    <section className="flex flex-col gap-4">
      <h1>Service requests</h1>

      {requests.length === 0 ? (
        <p className="text-muted-foreground">No service requests assigned to your center yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {requests.map(request => (
            <li key={request.serviceRequestId} className="border-border flex flex-col gap-3 rounded-md border p-3">
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
