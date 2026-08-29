import Link from 'next/link';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';
import { ReportService } from '@/lib/services';
import { formatPriceLabel } from '@/lib/utils';

import { StatTile } from '@/components/dashboard';
import { PageHeader } from '@/components/shared';

const reportService = new ReportService();

const LINKS = [
  { href: ROUTES.OWNER_VEHICLES.HREF, title: 'My vehicles', summary: 'Register a vehicle and track its details.' },
  { href: ROUTES.OWNER_SCHEDULES.HREF, title: 'Maintenance', summary: 'Set schedules and get reminders before a service falls due.' },
  { href: ROUTES.OWNER_BOOKINGS.HREF, title: 'Bookings', summary: 'Book a service at a verified center and follow its progress.' },
  { href: ROUTES.OWNER_MARKETPLACE.HREF, title: 'Marketplace', summary: 'Browse and order parts and supplies from verified suppliers.' },
  { href: ROUTES.OWNER_ORDERS.HREF, title: 'Orders', summary: 'Track your marketplace orders and their delivery.' },
  { href: ROUTES.OWNER_INVOICES.HREF, title: 'Invoices', summary: 'Settle bills for your services and orders.' },
  { href: ROUTES.OWNER_MESSAGES.HREF, title: 'Messages', summary: 'Talk to a service center about a booking.' },
] as const;

export default async function OwnerHomePage() {
  const user = await requireRole(USER_ROLES.OWNER);
  const summary = (await reportService.ownerMaintenanceSummary(user.userId)).result;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={`Welcome, ${user.name}`} description="Keep your vehicles, maintenance schedules and bookings in one place." />

      {summary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Vehicles" value={String(summary.vehicleCount)} />
          <StatTile label="Schedules" value={String(summary.scheduleCount)} />
          <StatTile label="Due soon" value={String(summary.dueSoonCount)} hint="due or overdue" />
          <StatTile label="Total spend" value={formatPriceLabel(summary.totalSpend)} hint="paid invoices" />
        </div>
      )}

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
