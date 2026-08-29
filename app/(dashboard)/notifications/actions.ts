'use server';

import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/constants/routes.const';

import { requireSession } from '@/lib/auth';
import { NotificationService } from '@/lib/services';

const notificationService = new NotificationService();

/** Mark all of the signed-in user's notifications read. */
export async function markAllReadAction(): Promise<void> {
  const user = await requireSession();

  await notificationService.markAllRead(user.userId);

  revalidatePath(ROUTES.NOTIFICATIONS.HREF);
}

/** Mark one of the signed-in user's notifications read. */
export async function markReadAction(formData: FormData): Promise<void> {
  const user = await requireSession();

  const notificationId = formData.get('notificationId');

  if (typeof notificationId === 'string' && notificationId) {
    await notificationService.markRead(user.userId, notificationId);
  }

  revalidatePath(ROUTES.NOTIFICATIONS.HREF);
}
