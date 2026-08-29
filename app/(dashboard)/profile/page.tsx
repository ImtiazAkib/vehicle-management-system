import { requireSession } from '@/lib/auth';
import { resolveRoleLabel } from '@/lib/utils';

/*
  The one screen every signed-in role shares. It sits at the dashboard root, behind the session alone, not
  under a role area — a profile is a profile whoever holds it. The editable form (name, phone, email change
  and password) lands in step 13.
*/
export default async function ProfilePage() {
  const user = await requireSession();

  return (
    <section className="flex flex-col gap-2">
      <h1>Profile</h1>
      <p className="text-muted-foreground">
        {user.name} · {user.email} · {resolveRoleLabel(user.role)}
      </p>
      <p className="text-muted-foreground text-sm">Editing your profile lands in step 13.</p>
    </section>
  );
}
