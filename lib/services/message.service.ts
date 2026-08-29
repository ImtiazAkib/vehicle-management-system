import { Types } from 'mongoose';

import { Conversation } from '@/models/conversation.model';
import { Message } from '@/models/message.model';
import { ServiceCenterProfile } from '@/models/service-center-profile.model';
import { ServiceRequest } from '@/models/service-request.model';
import { ConversationDto, MessageDto, conversationFromEntity, messageFromEntity } from '@/types';

import { CODES } from '@/constants/codes.const';
import { USER_ROLES } from '@/constants/roles.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import {
  EmptyResult,
  ListResult,
  SingleResult,
  createError,
  emptyFailureWithError,
  emptySuccess,
  listFailure,
  listSuccess,
  singleFailure,
  singleSuccess,
} from '@/lib/result';
import type { ErrorDto } from '@/lib/result';
import type { ConversationStartOutput, MessageSendOutput } from '@/lib/schemas';
import { isConversationParticipant, toId } from '@/lib/utils';

import { NotificationService } from './notification.service';
import { resolveCenterProfileId } from './service-center.service';

import type { ConversationEntity } from '@/models/conversation.model';
import type { MessageEntity } from '@/models/message.model';
import type { ServiceRequestEntity } from '@/models/service-request.model';
import type { UserRole } from '@/types';

const log = createLoggerWithContext('message.service');

const DATABASE = CODES.DATABASE.MESSAGING;
const VALIDATION = CODES.VALIDATION.MESSAGING;
const BUSINESS = CODES.BUSINESS.MESSAGING;

/** The signed-in actor a message operation runs as — a user id and the role that decides how it is scoped. */
export type MessageActor = {
  userId: string;
  role: UserRole;
};

/**
 * Owner ↔ service-center conversations, scoped to a booking. Every read and post re-checks the caller
 * against the conversation's two participants in the service, never in the page — a non-participant is
 * refused, whatever the screen shows.
 */
export class MessageService {
  private readonly notifications = new NotificationService();

  /**
   * Start or find the conversation for one of the owner's bookings. The center is taken from the booking,
   * and the same owner+center+booking always returns the one thread rather than spawning a second.
   *
   * @param ownerId - The signed-in owner.
   * @param input - The booking the conversation is about.
   *
   * @returns The conversation, or a failure.
   */
  public async startOrFind(ownerId: string, input: ConversationStartOutput): Promise<SingleResult<ConversationDto>> {
    try {
      await connectToDatabase();

      const booking = await ServiceRequest.findOne({ _id: input.serviceRequestId, owner: ownerId }).lean<ServiceRequestEntity | null>();

      if (!booking) {
        return singleFailure(createError(VALIDATION.BOOKING_NOT_FOUND.CODE, VALIDATION.BOOKING_NOT_FOUND.MESSAGE));
      }

      const filter = { owner: ownerId, serviceCenter: booking.serviceCenter, serviceRequest: booking._id };
      const existing = await Conversation.findOne(filter).lean<ConversationEntity | null>();

      if (existing) {
        return singleSuccess(conversationFromEntity(existing));
      }

      const conversation = await Conversation.create({ ...filter, lastMessageAt: new Date() });

      return singleSuccess(conversationFromEntity(conversation));
    } catch (error) {
      log.error({ err: error }, 'Starting a conversation failed');

      return singleFailure(createError(DATABASE.WRITE_FAILED.CODE, DATABASE.WRITE_FAILED.MESSAGE));
    }
  }

  /**
   * The owner's inbox, freshest thread first.
   *
   * @param ownerId - The signed-in owner.
   *
   * @returns The conversations, or a failure.
   */
  public async listForOwner(ownerId: string): Promise<ListResult<ConversationDto>> {
    try {
      await connectToDatabase();

      const conversations = await Conversation.find({ owner: ownerId }).sort({ lastMessageAt: -1 }).lean<ConversationEntity[]>();

      return listSuccess(conversations.map(conversationFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing owner conversations failed');

      return listFailure(createError(DATABASE.READ_FAILED.CODE, DATABASE.READ_FAILED.MESSAGE));
    }
  }

  /**
   * The center's inbox, freshest thread first, scoped to its own profile.
   *
   * @param centerUserId - The signed-in service-center account.
   *
   * @returns The conversations, or a failure. An account without a profile yet lists nothing.
   */
  public async listForCenter(centerUserId: string): Promise<ListResult<ConversationDto>> {
    try {
      await connectToDatabase();

      const profileId = await resolveCenterProfileId(centerUserId);

      if (!profileId) {
        return listSuccess([]);
      }

      const conversations = await Conversation.find({ serviceCenter: profileId }).sort({ lastMessageAt: -1 }).lean<ConversationEntity[]>();

      return listSuccess(conversations.map(conversationFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing center conversations failed');

      return listFailure(createError(DATABASE.READ_FAILED.CODE, DATABASE.READ_FAILED.MESSAGE));
    }
  }

  /**
   * The messages in a conversation, oldest first — only for a participant.
   *
   * @param actor - The signed-in user.
   * @param conversationId - The conversation to read.
   *
   * @returns The messages, or a failure.
   */
  public async listMessages(actor: MessageActor, conversationId: string): Promise<ListResult<MessageDto>> {
    try {
      await connectToDatabase();

      const access = await this.authorize(actor, conversationId);

      if (access.error) {
        return listFailure(access.error);
      }

      const messages = await Message.find({ conversation: conversationId }).sort({ createdAt: 1 }).lean<MessageEntity[]>();

      return listSuccess(messages.map(messageFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing messages failed');

      return listFailure(createError(DATABASE.READ_FAILED.CODE, DATABASE.READ_FAILED.MESSAGE));
    }
  }

  /**
   * Post a message to a conversation as a participant, and float the thread to the top of both inboxes.
   *
   * @param actor - The signed-in sender.
   * @param input - The conversation and the body.
   *
   * @returns The created message, or a failure.
   */
  public async send(actor: MessageActor, input: MessageSendOutput): Promise<SingleResult<MessageDto>> {
    try {
      await connectToDatabase();

      const access = await this.authorize(actor, input.conversationId);

      if (access.error || !access.conversation) {
        return singleFailure(access.error ?? createError(VALIDATION.CONVERSATION_NOT_FOUND.CODE, VALIDATION.CONVERSATION_NOT_FOUND.MESSAGE));
      }

      const message = await Message.create({ conversation: input.conversationId, sender: actor.userId, body: input.body });
      await Conversation.updateOne({ _id: input.conversationId }, { $set: { lastMessageAt: new Date() } });

      await this.notifyOther(actor, access.conversation);

      return singleSuccess(messageFromEntity(message));
    } catch (error) {
      log.error({ err: error }, 'Sending a message failed');

      return singleFailure(createError(DATABASE.WRITE_FAILED.CODE, DATABASE.WRITE_FAILED.MESSAGE));
    }
  }

  /**
   * Mark the other party's messages in a conversation as read, for a participant.
   *
   * @param actor - The signed-in reader.
   * @param conversationId - The conversation to mark.
   *
   * @returns Empty success, or a failure.
   */
  public async markRead(actor: MessageActor, conversationId: string): Promise<EmptyResult> {
    try {
      await connectToDatabase();

      const access = await this.authorize(actor, conversationId);

      if (access.error) {
        return emptyFailureWithError(access.error);
      }

      await Message.updateMany({ conversation: conversationId, sender: { $ne: actor.userId }, readAt: null }, { $set: { readAt: new Date() } });

      return emptySuccess();
    } catch (error) {
      log.error({ err: error }, 'Marking messages read failed');

      return emptyFailureWithError(createError(DATABASE.WRITE_FAILED.CODE, DATABASE.WRITE_FAILED.MESSAGE));
    }
  }

  /** Load the conversation and check the actor is a participant; return it, or the error to fail with. */
  private async authorize(actor: MessageActor, conversationId: string): Promise<{ conversation?: ConversationEntity; error?: ErrorDto }> {
    const conversation = await Conversation.findById(conversationId).lean<ConversationEntity | null>();

    if (!conversation) {
      return { error: createError(VALIDATION.CONVERSATION_NOT_FOUND.CODE, VALIDATION.CONVERSATION_NOT_FOUND.MESSAGE) };
    }

    const centerProfileId = actor.role === USER_ROLES.SERVICE_CENTER ? await resolveCenterProfileId(actor.userId) : null;
    const participants = { ownerId: toId(conversation.owner), serviceCenterId: toId(conversation.serviceCenter) };

    if (!isConversationParticipant(participants, actor.userId, centerProfileId)) {
      return { error: createError(BUSINESS.FORBIDDEN.CODE, BUSINESS.FORBIDDEN.MESSAGE) };
    }

    return { conversation };
  }

  /** Notify whichever participant did not send the message. */
  private async notifyOther(actor: MessageActor, conversation: ConversationEntity): Promise<void> {
    const ownerId = toId(conversation.owner);
    let recipientId: string | null = null;

    if (actor.userId === ownerId) {
      const profile = await ServiceCenterProfile.findById(conversation.serviceCenter).select('user').lean<{ user: Types.ObjectId } | null>();
      recipientId = profile ? toId(profile.user) : null;
    } else {
      recipientId = ownerId;
    }

    if (recipientId) {
      await this.notifications.create({
        userId: recipientId,
        type: 'message',
        title: 'New message',
        body: 'You have a new message about a booking.',
        data: { conversationId: toId(conversation._id) },
      });
    }
  }
}
