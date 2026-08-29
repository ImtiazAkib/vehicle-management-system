import Link from 'next/link';

import { ROUTES } from '@/constants/routes.const';

import { requireAdminArea } from '@/lib/auth';
import { ReportService } from '@/lib/services';
import { formatPriceLabel } from '@/lib/utils';

import { StatTile } from '@/components/dashboard';
import { PageHeader } from '@/components/shared';

const reportService = new ReportService();

const LINKS = [
  { href: ROUTES.ADMIN_USERS.HREF, title: 'Users', summary: 'Every account — activate or deactivate.' },
  { href: ROUTES.ADMIN_VERIFICATIONS.HREF, title: 'Verifications', summary: 'Approve service centers and suppliers.' },
  { href: ROUTES.ADMIN_REPORTS.HREF, title: 'Reports', summary: 'The platform-wide overview and figures.' },
] as const;

export default async function AdminHomePage() {
  const user = await requireAdminArea();
  const overview = (await reportService.adminPlatformOverview()).result;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={`Welcome, ${user.name}`} description="Govern accounts and verify the businesses that transact on the platform." />

      {overview && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Owners" value={String(overview.ownerCount)} />
          <StatTile label="Bookings" value={String(overview.bookingCount)} />
          <StatTile label="Orders" value={String(overview.orderCount)} />
          <StatTile label="Revenue" value={formatPriceLabel(overview.revenue)} hint="settled" />
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
