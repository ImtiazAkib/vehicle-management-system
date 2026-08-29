import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';

export default async function OwnerHomePage() {
  const user = await requireRole(USER_ROLES.OWNER);

  return (
    <section className="flex flex-col gap-2">
      <h1>Welcome, {user.name}</h1>
      <p className="text-muted-foreground">
        Your vehicles, maintenance schedules, bookings and orders will appear here — vehicle records land in step 7.
      </p>
    </section>
  );
}
