import mongoose, { Model, Schema, Types } from 'mongoose';

import { ReviewTargetType } from '@/types';

import { REVIEW_TARGET_TYPES } from '@/constants/enums.const';

export type ReviewAttributes = {
  author: Types.ObjectId;
  targetType: ReviewTargetType;
  targetId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
};
export type ReviewEntity = ReviewAttributes & { _id: Types.ObjectId };
type ReviewModel = Model<ReviewAttributes>;

const reviewSchema = new Schema<ReviewAttributes, ReviewModel>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, required: true, enum: Object.values(REVIEW_TARGET_TYPES) },
    targetId: { type: Schema.Types.ObjectId, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);
reviewSchema.index({ targetType: 1, targetId: 1 });
reviewSchema.index({ author: 1 });

export const Review = (mongoose.models.Review as ReviewModel) ?? mongoose.model<ReviewAttributes, ReviewModel>('Review', reviewSchema);
