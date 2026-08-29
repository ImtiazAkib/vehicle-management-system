import { Bell } from 'lucide-react';

import { requireSession } from '@/lib/auth';
import { NotificationService } from '@/lib/services';
import { cn } from '@/lib/utils';

import { EmptyState, PageHeader } from '@/components/shared';

import { markAllReadAction, markReadAction } from './actions';

const notificationService = new NotificationService();

export default async function NotificationsPage() {
  const user = await requireSession();
  const notifications = (await notificationService.listForUser(user.userId)).result ?? [];
  const hasUnread = notifications.some(notification => !notification.isRead);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        description="Reminders and updates from across the platform."
        action={
          hasUnread ? (
            <form action={markAllReadAction}>
              <button type="submit" className="border-border hover:bg-muted rounded-md border px-4 py-2 text-sm font-medium transition-colors">
                Mark all read
              </button>
            </form>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="Updates about your bookings, orders and messages will appear here." />
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map(notification => (
            <li
              key={notification.notificationId}
              className={cn('surface-card flex items-start justify-between gap-4 p-4', !notification.isRead && 'border-primary/40')}>
              <div className="flex items-start gap-3">
                {!notification.isRead && <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" aria-hidden />}
                <div>
                  <p className="font-medium">{notification.title}</p>
                  <p className="text-muted-foreground text-sm">{notification.body}</p>
                  <p className="text-muted-foreground mt-1 text-xs">{new Date(notification.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {!notification.isRead && (
                <form action={markReadAction}>
                  <input type="hidden" name="notificationId" value={notification.notificationId} />
                  <button type="submit" className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline">
                    Mark read
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
