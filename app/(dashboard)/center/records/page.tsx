import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';
import { ServiceCenterService } from '@/lib/services';
import { formatPriceLabel } from '@/lib/utils';

const centerService = new ServiceCenterService();

export default async function CenterRecordsPage() {
  const center = await requireRole(USER_ROLES.SERVICE_CENTER);
  const records = (await centerService.recordsForCenter(center.userId)).result ?? [];

  return (
    <section className="flex flex-col gap-4">
      <h1>Records</h1>

      {records.length === 0 ? (
        <p className="text-muted-foreground">No maintenance records yet. Completing a booking writes one here.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {records.map(record => (
            <li key={record.recordId} className="border-border flex items-center justify-between gap-4 rounded-md border p-3">
              <div>
                <p className="font-medium">{record.serviceType}</p>
                <p className="text-muted-foreground text-sm">
                  {new Date(record.performedOn).toLocaleDateString()} · {record.mileageAtService.toLocaleString()} km ·{' '}
                  {formatPriceLabel(record.cost)}
                </p>
                {record.notes ? <p className="text-muted-foreground mt-1 text-sm">{record.notes}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
