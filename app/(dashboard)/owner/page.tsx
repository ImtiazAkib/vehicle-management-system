import Link from 'next/link';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';

export default async function OwnerHomePage() {
  const user = await requireRole(USER_ROLES.OWNER);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1>Welcome, {user.name}</h1>
        <p className="text-muted-foreground">Keep your vehicles, maintenance schedules and bookings in one place.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Link href={ROUTES.OWNER_VEHICLES.HREF} className="border-border hover:bg-muted flex flex-col gap-0.5 rounded-md border p-4">
          <span className="text-sm font-semibold">My vehicles</span>
          <span className="text-muted-foreground text-sm">Register a vehicle and track its details.</span>
        </Link>
      </div>
    </section>
  );
}
