import Link from 'next/link';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';

import { PageHeader } from '@/components/shared';

const LINKS = [
  { href: ROUTES.OWNER_VEHICLES.HREF, title: 'My vehicles', summary: 'Register a vehicle and track its details.' },
  { href: ROUTES.OWNER_SCHEDULES.HREF, title: 'Maintenance', summary: 'Set schedules and get reminders before a service falls due.' },
  { href: ROUTES.OWNER_BOOKINGS.HREF, title: 'Bookings', summary: 'Book a service at a verified center and follow its progress.' },
  { href: ROUTES.OWNER_MARKETPLACE.HREF, title: 'Marketplace', summary: 'Browse and order parts and supplies from verified suppliers.' },
  { href: ROUTES.OWNER_ORDERS.HREF, title: 'Orders', summary: 'Track your marketplace orders and their delivery.' },
  { href: ROUTES.OWNER_INVOICES.HREF, title: 'Invoices', summary: 'Settle bills for your services and orders.' },
] as const;

export default async function OwnerHomePage() {
  const user = await requireRole(USER_ROLES.OWNER);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={`Welcome, ${user.name}`} description="Keep your vehicles, maintenance schedules and bookings in one place." />

      <div className="grid gap-3 sm:grid-cols-2">
        {LINKS.map(link => (
          <Link key={link.href} href={link.href} className="surface-card hover:bg-muted flex flex-col gap-0.5 p-5 transition-colors">
            <span className="text-sm font-semibold">{link.title}</span>
            <span className="text-muted-foreground text-sm">{link.summary}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
