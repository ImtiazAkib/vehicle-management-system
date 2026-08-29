import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';

export default async function CenterHomePage() {
  const user = await requireRole(USER_ROLES.SERVICE_CENTER);

  return (
    <section className="flex flex-col gap-2">
      <h1>Service center</h1>
      <p className="text-muted-foreground">
        Welcome, {user.name}. Assigned service requests, maintenance records and invoices land here across steps 9 and 10.
      </p>
    </section>
  );
}
