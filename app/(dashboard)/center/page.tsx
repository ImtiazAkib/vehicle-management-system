import Link from 'next/link';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';

export default async function CenterHomePage() {
  const user = await requireRole(USER_ROLES.SERVICE_CENTER);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1>Service center</h1>
        <p className="text-muted-foreground">Welcome, {user.name}. Work the requests assigned to your center and keep them moving.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Link href={ROUTES.CENTER_REQUESTS.HREF} className="border-border hover:bg-muted flex flex-col gap-0.5 rounded-md border p-4">
          <span className="text-sm font-semibold">Service requests</span>
          <span className="text-muted-foreground text-sm">Accept, schedule, start and complete the bookings assigned to you.</span>
        </Link>
      </div>
    </section>
  );
}
