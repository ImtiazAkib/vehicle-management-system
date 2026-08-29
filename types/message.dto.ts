import { toId } from '@/lib/utils';

import type { MessageEntity } from '@/models/message.model';

export type MessageDto = {
  messageId: string;
  conversationId: string;
  senderId: string;
  body: string;
  hasAttachment: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function messageFromEntity(entity: MessageEntity): MessageDto {
  return {
    messageId: toId(entity._id),
    conversationId: toId(entity.conversation),
    senderId: toId(entity.sender),
    body: entity.body,
    hasAttachment: Boolean(entity.attachmentStorageKey),
    readAt: entity.readAt ? entity.readAt.toISOString() : null,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
