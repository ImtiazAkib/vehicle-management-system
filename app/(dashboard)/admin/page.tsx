import Link from 'next/link';

import { ROUTES } from '@/constants/routes.const';

import { requireAdminArea } from '@/lib/auth';

import { PageHeader } from '@/components/shared';

const LINKS = [
  { href: ROUTES.ADMIN_USERS.HREF, title: 'Users', summary: 'Every account — activate or deactivate.' },
  { href: ROUTES.ADMIN_VERIFICATIONS.HREF, title: 'Verifications', summary: 'Approve service centers and suppliers.' },
] as const;

export default async function AdminHomePage() {
  const user = await requireAdminArea();

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={`Welcome, ${user.name}`} description="Govern accounts and verify the businesses that transact on the platform." />

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
