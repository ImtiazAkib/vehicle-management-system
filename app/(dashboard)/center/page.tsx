import Link from 'next/link';

import { SERVICE_REQUEST_STATUSES } from '@/constants/enums.const';
import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';
import { ServiceRequestService } from '@/lib/services';

import { PageHeader } from '@/components/shared';

const service = new ServiceRequestService();

const LINKS = [
  { href: ROUTES.CENTER_REQUESTS.HREF, title: 'Service requests', summary: 'Accept, schedule, start and complete your bookings.' },
  { href: ROUTES.CENTER_RECORDS.HREF, title: 'Records', summary: 'The maintenance work your center has logged.' },
  { href: ROUTES.CENTER_INVOICES.HREF, title: 'Invoices', summary: 'Bill completed bookings and track what is owed.' },
  { href: ROUTES.CENTER_PROFILE.HREF, title: 'Center profile', summary: 'The details owners see when booking you.' },
] as const;

export default async function CenterHomePage() {
  const user = await requireRole(USER_ROLES.SERVICE_CENTER);
  const requests = (await service.findForCenter(user.userId)).result ?? [];

  const stats = [
    { label: 'Pending', value: requests.filter(request => request.status === SERVICE_REQUEST_STATUSES.PENDING).length },
    { label: 'In progress', value: requests.filter(request => request.status === SERVICE_REQUEST_STATUSES.IN_PROGRESS).length },
    { label: 'Completed', value: requests.filter(request => request.status === SERVICE_REQUEST_STATUSES.COMPLETED).length },
  ];

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={`Welcome, ${user.name}`} description="Work the requests assigned to your center, record what you did, and bill for it." />

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map(stat => (
          <div key={stat.label} className="surface-card flex flex-col gap-0.5 p-5">
            <span className="text-2xl font-semibold">{stat.value}</span>
            <span className="text-muted-foreground text-sm">{stat.label}</span>
          </div>
        ))}
      </div>

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
