import mongoose, { Model, Schema, Types } from 'mongoose';

export type MessageAttributes = {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  body: string;
  attachmentStorageKey?: string;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};
export type MessageEntity = MessageAttributes & { _id: Types.ObjectId };
type MessageModel = Model<MessageAttributes>;

const messageSchema = new Schema<MessageAttributes, MessageModel>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    attachmentStorageKey: { type: String, maxlength: 512 },
    readAt: { type: Date },
  },
  { timestamps: true }
);
messageSchema.index({ conversation: 1, createdAt: 1 });

export const Message = (mongoose.models.Message as MessageModel) ?? mongoose.model<MessageAttributes, MessageModel>('Message', messageSchema);
