import { toId } from '@/lib/utils';

import type { ReviewTargetType } from './enums';
import type { ReviewEntity } from '@/models/review.model';

export type ReviewDto = {
  reviewId: string;
  authorId: string;
  targetType: ReviewTargetType;
  targetId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function reviewFromEntity(entity: ReviewEntity): ReviewDto {
  return {
    reviewId: toId(entity._id),
    authorId: toId(entity.author),
    targetType: entity.targetType,
    targetId: toId(entity.targetId),
    rating: entity.rating,
    comment: entity.comment ?? null,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
