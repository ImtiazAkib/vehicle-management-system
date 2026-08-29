import { requireSession } from '@/lib/auth';
import { resolveRoleLabel } from '@/lib/utils';

import { PageHeader } from '@/components/shared';

/*
  The one screen every signed-in role shares. It sits at the dashboard root, behind the session alone, not
  under a role area — a profile is a profile whoever holds it. The editable form (name, phone, email change
  and password) lands in a later step.
*/
export default async function ProfilePage() {
  const user = await requireSession();

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Profile" description="Your account details, shared across every area you can reach." />

      <div className="surface-card flex flex-col gap-1 p-6">
        <p className="font-medium">{user.name}</p>
        <p className="text-muted-foreground text-sm">
          {user.email} · {resolveRoleLabel(user.role)}
        </p>
        <p className="text-muted-foreground mt-2 text-sm">Editing your profile is coming soon.</p>
      </div>
    </section>
  );
}
