import { toId } from '@/lib/utils';

import type { NotificationChannel } from './enums';
import type { NotificationEntity } from '@/models/notification.model';

export type NotificationDto = {
  notificationId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  channel: NotificationChannel;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

export function notificationFromEntity(entity: NotificationEntity): NotificationDto {
  return {
    notificationId: toId(entity._id),
    userId: toId(entity.user),
    type: entity.type,
    title: entity.title,
    body: entity.body,
    channel: entity.channel,
    data: entity.data ?? null,
    isRead: entity.isRead,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
