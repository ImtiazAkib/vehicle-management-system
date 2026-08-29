import { Notification } from '@/models/notification.model';
import { User } from '@/models/user.model';
import { NotificationDto, notificationFromEntity } from '@/types';

import { CODES } from '@/constants/codes.const';
import { NOTIFICATION_CHANNELS } from '@/constants/enums.const';

import { createLoggerWithContext } from '@/lib/logger';
import { mail } from '@/lib/mail';
import { connectToDatabase } from '@/lib/mongodb';
import { EmptyResult, ListResult, createError, emptyFailureWithError, emptySuccess, listFailure, listSuccess } from '@/lib/result';

import type { NotificationEntity } from '@/models/notification.model';

const log = createLoggerWithContext('notification.service');

const DATABASE = CODES.DATABASE.COMMON;

/** How many notifications the feed shows. */
const FEED_LIMIT = 30;

/** The facts a domain event hands to a recipient's notification. */
export type NotificationInput = {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

/**
 * The recipient-scoped notification feed. The in-app row is the source of truth, written first; the email
 * is a best-effort echo of the same event (nodemailer, or the log transport when SMTP is absent). A failed
 * echo is logged, never thrown — the record is the notification, the email only its copy. Creation never
 * throws, so a producer's own write is never undone by a notification.
 */
export class NotificationService {
  /**
   * Write a notification for a recipient and best-effort email it. Swallows its own errors so a domain
   * event that triggers it is never rolled back by a failed notification.
   *
   * @param input - The recipient and the message.
   */
  public async create(input: NotificationInput): Promise<void> {
    try {
      await connectToDatabase();

      await Notification.create({
        user: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        channel: NOTIFICATION_CHANNELS.IN_APP,
        data: input.data,
        isRead: false,
      });

      const user = await User.findById(input.userId).select('email').lean<{ email: string } | null>();

      if (user?.email) {
        await mail.send({ to: user.email, subject: input.title, text: input.body, html: `<p>${input.body}</p>` });
      }
    } catch (error) {
      log.warn({ err: error }, 'Creating a notification failed');
    }
  }

  /**
   * A user's notifications, newest first.
   *
   * @param userId - The signed-in user.
   *
   * @returns The notifications, or a failure.
   */
  public async listForUser(userId: string): Promise<ListResult<NotificationDto>> {
    try {
      await connectToDatabase();

      const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(FEED_LIMIT).lean<NotificationEntity[]>();

      return listSuccess(notifications.map(notificationFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing notifications failed');

      return listFailure(createError(DATABASE.QUERY_FAILED.CODE, DATABASE.QUERY_FAILED.MESSAGE));
    }
  }

  /**
   * The count of a user's unread notifications — the topbar bell's number.
   *
   * @param userId - The signed-in user.
   *
   * @returns The unread count, or 0 on any error (the bell must never break a page).
   */
  public async unreadCount(userId: string): Promise<number> {
    try {
      await connectToDatabase();

      return await Notification.countDocuments({ user: userId, isRead: false });
    } catch (error) {
      log.error({ err: error }, 'Counting notifications failed');

      return 0;
    }
  }

  /**
   * Mark one of a user's notifications read.
   *
   * @param userId - The signed-in user.
   * @param notificationId - The notification to mark.
   *
   * @returns Empty success, or a failure.
   */
  public async markRead(userId: string, notificationId: string): Promise<EmptyResult> {
    return this.mark({ _id: notificationId, user: userId });
  }

  /**
   * Mark all of a user's notifications read.
   *
   * @param userId - The signed-in user.
   *
   * @returns Empty success, or a failure.
   */
  public async markAllRead(userId: string): Promise<EmptyResult> {
    return this.mark({ user: userId, isRead: false });
  }

  /** Flip `isRead` on the notifications matching a scoped filter. */
  private async mark(filter: Record<string, string | boolean>): Promise<EmptyResult> {
    try {
      await connectToDatabase();

      await Notification.updateMany(filter, { $set: { isRead: true } });

      return emptySuccess();
    } catch (error) {
      log.error({ err: error }, 'Marking notifications read failed');

      return emptyFailureWithError(createError(DATABASE.WRITE_FAILED.CODE, DATABASE.WRITE_FAILED.MESSAGE));
    }
  }
}
