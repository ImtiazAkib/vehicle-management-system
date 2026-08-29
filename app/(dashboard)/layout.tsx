import type { ReactNode } from 'react';

import type { Metadata } from 'next';

import { requireSession } from '@/lib/auth';
import { NotificationService } from '@/lib/services';
import { resolveInitials, resolveRoleLabel, roleAccentClassName } from '@/lib/utils';

import { DashboardSidebar, DashboardTopbar } from '@/components/dashboard';

const notificationService = new NotificationService();

/*
  Two independent signals keep the signed-in surface out of search results: this metadata, and the
  `Disallow` entries `robots.ts` derives from `PROTECTED_SEGMENTS`. Either alone can fail; a back office
  in a search index is not a mistake you can take back.
*/
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type DashboardLayoutProps = {
  children: ReactNode;
};

/**
 * The shell every signed-in area sits in: a sidebar, a topbar and the scrolling main region.
 *
 * The session is established once here and the identity derived once, then handed to the sidebar and
 * topbar as one `user` object. The guard is on this layout **and** on each page, so a route added under
 * this group is protected before anybody remembers to protect it — and the page can still name the exact
 * role it needs.
 */
export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const sessionUser = await requireSession();
  const unread = await notificationService.unreadCount(sessionUser.userId);

  const user = {
    name: sessionUser.name,
    roleLabel: resolveRoleLabel(sessionUser.role),
    initials: resolveInitials(sessionUser.name),
    accentClassName: roleAccentClassName(sessionUser.role),
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden lg:flex-row">
      <DashboardSidebar role={sessionUser.role} user={user} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <DashboardTopbar user={user} unread={unread} />

        <main id="main-content" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
