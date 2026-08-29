import Link from 'next/link';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';

const LINKS = [
  { href: ROUTES.OWNER_VEHICLES.HREF, title: 'My vehicles', summary: 'Register a vehicle and track its details.' },
  { href: ROUTES.OWNER_SCHEDULES.HREF, title: 'Maintenance', summary: 'Set schedules and get reminders before a service falls due.' },
] as const;

export default async function OwnerHomePage() {
  const user = await requireRole(USER_ROLES.OWNER);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1>Welcome, {user.name}</h1>
        <p className="text-muted-foreground">Keep your vehicles, maintenance schedules and bookings in one place.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {LINKS.map(link => (
          <Link key={link.href} href={link.href} className="border-border hover:bg-muted flex flex-col gap-0.5 rounded-md border p-4">
            <span className="text-sm font-semibold">{link.title}</span>
            <span className="text-muted-foreground text-sm">{link.summary}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
