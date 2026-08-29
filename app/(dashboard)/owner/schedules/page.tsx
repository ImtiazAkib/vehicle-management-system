import Link from 'next/link';

import { Wrench } from 'lucide-react';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';
import { MaintenanceService } from '@/lib/services';

import { deleteScheduleAction } from '@/components/owner/actions';
import { EmptyState, PageHeader } from '@/components/shared';

const maintenanceService = new MaintenanceService();

export default async function OwnerSchedulesPage() {
  const owner = await requireRole(USER_ROLES.OWNER);
  const schedules = (await maintenanceService.listForOwner(owner.userId)).result ?? [];

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Maintenance"
        description="Set schedules and get a reminder before a service falls due."
        action={
          <Link
            href={ROUTES.OWNER_SCHEDULES_NEW.HREF}
            className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex rounded-md px-4 py-2 text-sm font-semibold transition-colors">
            Add a schedule
          </Link>
        }
      />

      {schedules.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No maintenance schedules yet"
          description="Add a schedule to get a reminder before a service falls due."
          action={
            <Link
              href={ROUTES.OWNER_SCHEDULES_NEW.HREF}
              className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex rounded-md px-4 py-2 text-sm font-semibold transition-colors">
              Add a schedule
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {schedules.map(schedule => (
            <li key={schedule.scheduleId} className="surface-card flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-medium">{schedule.serviceType}</p>
                <p className="text-muted-foreground text-sm">
                  Due {new Date(schedule.nextDueDate).toLocaleDateString()} · {schedule.status.toLowerCase()}
                </p>
              </div>
              <form action={deleteScheduleAction}>
                <input type="hidden" name="scheduleId" value={schedule.scheduleId} />
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
