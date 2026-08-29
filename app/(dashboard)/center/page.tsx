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
  { href: ROUTES.CENTER_REQUESTS.HREF, title: 'Service requests', summary: 'Accept, schedule, start and complete your bookings.' },
  { href: ROUTES.CENTER_RECORDS.HREF, title: 'Records', summary: 'The maintenance work your center has logged.' },
  { href: ROUTES.CENTER_INVOICES.HREF, title: 'Invoices', summary: 'Bill completed bookings and track what is owed.' },
  { href: ROUTES.CENTER_MESSAGES.HREF, title: 'Messages', summary: 'Talk to owners about their bookings.' },
  { href: ROUTES.CENTER_PROFILE.HREF, title: 'Center profile', summary: 'The details owners see when booking you.' },
] as const;

export default async function CenterHomePage() {
  const user = await requireRole(USER_ROLES.SERVICE_CENTER);
  const report = (await reportService.serviceCenterPerformance(user.userId)).result;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={`Welcome, ${user.name}`} description="Work the requests assigned to your center, record what you did, and bill for it." />

      {report && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Requests" value={String(report.requestCount)} />
          <StatTile label="Completed" value={String(report.completedCount)} />
          <StatTile
            label="Completion rate"
            value={`${Math.round(report.completionRate * 100)}%`}
            hint={`${report.completedCount} of ${report.requestCount}`}
          />
          <StatTile label="Revenue" value={formatPriceLabel(report.revenue)} hint="paid invoices" />
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
