import { toId } from '@/lib/utils';

import type { ConversationEntity } from '@/models/conversation.model';

export type ConversationDto = {
  conversationId: string;
  ownerId: string;
  serviceCenterId: string;
  serviceRequestId?: string | null;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
};

export function conversationFromEntity(entity: ConversationEntity): ConversationDto {
  return {
    conversationId: toId(entity._id),
    ownerId: toId(entity.owner),
    serviceCenterId: toId(entity.serviceCenter),
    serviceRequestId: entity.serviceRequest ? toId(entity.serviceRequest) : null,
    lastMessageAt: entity.lastMessageAt.toISOString(),
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
