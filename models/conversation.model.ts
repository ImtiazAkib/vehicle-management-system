import mongoose, { Model, Schema, Types } from 'mongoose';

export type ConversationAttributes = {
  owner: Types.ObjectId;
  serviceCenter: Types.ObjectId;
  serviceRequest?: Types.ObjectId;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
export type ConversationEntity = ConversationAttributes & { _id: Types.ObjectId };
type ConversationModel = Model<ConversationAttributes>;

const conversationSchema = new Schema<ConversationAttributes, ConversationModel>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    serviceCenter: { type: Schema.Types.ObjectId, ref: 'ServiceCenterProfile', required: true },
    serviceRequest: { type: Schema.Types.ObjectId, ref: 'ServiceRequest' },
    lastMessageAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);
conversationSchema.index({ owner: 1 });
conversationSchema.index({ serviceCenter: 1 });

export const Conversation =
  (mongoose.models.Conversation as ConversationModel) ??
  mongoose.model<ConversationAttributes, ConversationModel>('Conversation', conversationSchema);
