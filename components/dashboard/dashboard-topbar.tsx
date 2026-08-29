import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants/routes.const';

import { clearSessionCookie } from '@/lib/auth';

import type { DashboardShellUser } from './dashboard-sidebar';

type DashboardTopbarProps = {
  user: DashboardShellUser;
};

/*
  The top of the main region: who is signed in, and the way out. Sign-out is an inline server action —
  `clearSessionCookie()` then a redirect — so the button needs no client JavaScript to work.
*/
export function DashboardTopbar({ user }: DashboardTopbarProps) {
  async function signOut() {
    'use server';
    await clearSessionCookie();
    redirect(ROUTES.SIGN_IN.HREF);
  }

  return (
    <header className="border-border flex items-center justify-between gap-4 border-b px-4 py-3 lg:px-8">
      <p className="text-muted-foreground text-sm">
        Signed in as <span className="text-foreground font-medium">{user.name}</span>
      </p>

      <form action={signOut}>
        <button type="submit" className="border-border hover:bg-muted rounded-md border px-3 py-1.5 text-sm font-medium">
          Sign out
        </button>
      </form>
    </header>
  );
}
