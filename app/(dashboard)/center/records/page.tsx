import { Wrench } from 'lucide-react';

import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';
import { ServiceCenterService } from '@/lib/services';
import { formatPriceLabel } from '@/lib/utils';

import { EmptyState, PageHeader } from '@/components/shared';

const centerService = new ServiceCenterService();

export default async function CenterRecordsPage() {
  const center = await requireRole(USER_ROLES.SERVICE_CENTER);
  const records = (await centerService.recordsForCenter(center.userId)).result ?? [];

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Records" description="The maintenance work your center has logged — one per completed booking." />

      {records.length === 0 ? (
        <EmptyState icon={Wrench} title="No records yet" description="Completing a booking writes a durable maintenance record here." />
      ) : (
        <ul className="flex flex-col gap-2">
          {records.map(record => (
            <li key={record.recordId} className="surface-card flex items-center justify-between gap-4 p-4">
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
