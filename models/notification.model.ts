import mongoose, { Model, Schema, Types } from 'mongoose';

import { NotificationChannel } from '@/types';

import { NOTIFICATION_CHANNELS } from '@/constants/enums.const';

export type NotificationAttributes = {
  user: Types.ObjectId;
  type: string;
  title: string;
  body: string;
  channel: NotificationChannel;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
};
export type NotificationEntity = NotificationAttributes & { _id: Types.ObjectId };
type NotificationModel = Model<NotificationAttributes>;

const notificationSchema = new Schema<NotificationAttributes, NotificationModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true, trim: true, maxlength: 80 },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    channel: { type: String, required: true, enum: Object.values(NOTIFICATION_CHANNELS) },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

export const Notification =
  (mongoose.models.Notification as NotificationModel) ??
  mongoose.model<NotificationAttributes, NotificationModel>('Notification', notificationSchema);
