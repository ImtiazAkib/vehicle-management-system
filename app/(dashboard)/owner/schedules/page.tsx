import Link from 'next/link';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';
import { MaintenanceService } from '@/lib/services';

import { deleteScheduleAction } from '@/components/owner/actions';

const maintenanceService = new MaintenanceService();

export default async function OwnerSchedulesPage() {
  const owner = await requireRole(USER_ROLES.OWNER);
  const schedules = (await maintenanceService.listForOwner(owner.userId)).result ?? [];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1>Maintenance</h1>
        <Link
          href={ROUTES.OWNER_SCHEDULES_NEW.HREF}
          className="bg-primary text-primary-foreground hover:bg-primary-hover rounded-md px-4 py-2 text-sm font-semibold">
          Add a schedule
        </Link>
      </div>

      {schedules.length === 0 ? (
        <p className="text-muted-foreground">No maintenance schedules yet. Add one to get a reminder before a service falls due.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {schedules.map(schedule => (
            <li key={schedule.scheduleId} className="border-border flex items-center justify-between gap-4 rounded-md border p-3">
              <div>
                <p className="font-medium">{schedule.serviceType}</p>
                <p className="text-muted-foreground text-sm">
                  Due {new Date(schedule.nextDueDate).toLocaleDateString()} · {schedule.status.toLowerCase()}
                </p>
              </div>
              <form action={deleteScheduleAction}>
                <input type="hidden" name="scheduleId" value={schedule.scheduleId} />
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
