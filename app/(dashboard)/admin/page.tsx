import Link from 'next/link';

import { ROUTES } from '@/constants/routes.const';

import { requireAdminArea } from '@/lib/auth';

const LINKS = [
  { href: ROUTES.ADMIN_USERS.HREF, title: 'Users', summary: 'Every account — activate or deactivate.' },
  { href: ROUTES.ADMIN_VERIFICATIONS.HREF, title: 'Verifications', summary: 'Approve service centers and suppliers.' },
] as const;

export default async function AdminHomePage() {
  const user = await requireAdminArea();

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1>Administration</h1>
        <p className="text-muted-foreground">Welcome, {user.name}. Govern accounts and verify the businesses that transact on the platform.</p>
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
