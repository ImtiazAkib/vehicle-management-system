import Link from 'next/link';

import { Bell } from 'lucide-react';

import { ROUTES } from '@/constants/routes.const';

/** The topbar bell — a link to the feed with the unread count as a badge. */
export function NotificationBell({ unread }: { unread: number }) {
  return (
    <Link
      href={ROUTES.NOTIFICATIONS.HREF}
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      className="hover:bg-muted relative inline-flex size-9 items-center justify-center rounded-md transition-colors">
      <Bell className="size-5" aria-hidden />
      {unread > 0 && (
        <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
}
