import mongoose from 'mongoose';

import { OrderItem } from '@/models/order-item.model';
import { Order } from '@/models/order.model';
import { Product } from '@/models/product.model';
import { Review } from '@/models/review.model';
import { ServiceCenterProfile } from '@/models/service-center-profile.model';
import { ServiceRequest } from '@/models/service-request.model';
import { SupplierProfile } from '@/models/supplier-profile.model';
import { ReviewDto, reviewFromEntity } from '@/types';

import { CODES } from '@/constants/codes.const';
import { ORDER_STATUSES, REVIEW_TARGET_TYPES, SERVICE_REQUEST_STATUSES } from '@/constants/enums.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import { ListResult, SingleResult, createError, listFailure, listSuccess, singleFailure, singleSuccess } from '@/lib/result';
import type { ReviewCreateOutput } from '@/lib/schemas';
import { computeRatingAggregate } from '@/lib/utils';

import type { ReviewEntity } from '@/models/review.model';
import type { ReviewTargetType } from '@/types';
import type { ClientSession } from 'mongoose';

const log = createLoggerWithContext('review.service');

const DATABASE = CODES.DATABASE.REVIEWS;
const BUSINESS = CODES.BUSINESS.REVIEWS;

/**
 * Owner-authored reviews. Only an owner reviews — the owner is the customer in every relationship — and
 * only something they actually transacted with. Each write upserts one review per author per target and
 * re-derives the target's rating aggregate from the surviving rows, both inside one transaction.
 */
export class ReviewService {
  /**
   * Create or update the owner's review of a target, then recompute the target's aggregate. Refused when
   * the owner has not transacted with the target.
   *
   * @param ownerId - The signed-in owner (the author).
   * @param input - The target, the rating and an optional comment.
   *
   * @returns The saved review, or a failure.
   */
  public async create(ownerId: string, input: ReviewCreateOutput): Promise<SingleResult<ReviewDto>> {
    try {
      await connectToDatabase();

      if (!(await this.hasTransacted(ownerId, input.targetType, input.targetId))) {
        return singleFailure(createError(BUSINESS.NOT_TRANSACTED.CODE, BUSINESS.NOT_TRANSACTED.MESSAGE));
      }

      const session = await mongoose.startSession();
      let reviewDto: ReviewDto | null = null;

      try {
        await session.withTransaction(async () => {
          const review = await Review.findOneAndUpdate(
            { author: ownerId, targetType: input.targetType, targetId: input.targetId },
            { $set: { rating: input.rating, comment: input.comment } },
            { upsert: true, new: true, session }
          );

          await this.recompute(input.targetType, input.targetId, session);

          reviewDto = review ? reviewFromEntity(review) : null;
        });
      } finally {
        await session.endSession();
      }

      if (!reviewDto) {
        return singleFailure(createError(DATABASE.WRITE_FAILED.CODE, DATABASE.WRITE_FAILED.MESSAGE));
      }

      return singleSuccess(reviewDto);
    } catch (error) {
      log.error({ err: error }, 'Creating a review failed');

      return singleFailure(createError(DATABASE.WRITE_FAILED.CODE, DATABASE.WRITE_FAILED.MESSAGE));
    }
  }

  /**
   * The reviews of a target, newest first.
   *
   * @param targetType - The kind of target.
   * @param targetId - The target id.
   *
   * @returns The reviews, or a failure.
   */
  public async listByTarget(targetType: ReviewTargetType, targetId: string): Promise<ListResult<ReviewDto>> {
    try {
      await connectToDatabase();

      const reviews = await Review.find({ targetType, targetId }).sort({ createdAt: -1 }).lean<ReviewEntity[]>();

      return listSuccess(reviews.map(reviewFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing reviews failed');

      return listFailure(createError(DATABASE.READ_FAILED.CODE, DATABASE.READ_FAILED.MESSAGE));
    }
  }

  /** Whether the owner has a completed/delivered transaction with the target — the gate a review presupposes. */
  private async hasTransacted(ownerId: string, targetType: ReviewTargetType, targetId: string): Promise<boolean> {
    if (targetType === REVIEW_TARGET_TYPES.SERVICE_CENTER) {
      return Boolean(await ServiceRequest.exists({ owner: ownerId, serviceCenter: targetId, status: SERVICE_REQUEST_STATUSES.COMPLETED }));
    }

    if (targetType === REVIEW_TARGET_TYPES.SUPPLIER) {
      return Boolean(await Order.exists({ buyer: ownerId, supplier: targetId, status: ORDER_STATUSES.DELIVERED }));
    }

    const deliveredOrderIds = await Order.find({ buyer: ownerId, status: ORDER_STATUSES.DELIVERED }).distinct('_id');

    return Boolean(await OrderItem.exists({ order: { $in: deliveredOrderIds }, product: targetId }));
  }

  /** Re-aggregate the target's `ratingAvg` / `ratingCount` from the current review rows, inside the session. */
  private async recompute(targetType: ReviewTargetType, targetId: string, session: ClientSession): Promise<void> {
    const rows = await Review.find({ targetType, targetId }).select('rating').session(session).lean<{ rating: number }[]>();
    const aggregate = computeRatingAggregate(rows.map(row => row.rating));
    const update = { $set: aggregate };

    if (targetType === REVIEW_TARGET_TYPES.SERVICE_CENTER) {
      await ServiceCenterProfile.updateOne({ _id: targetId }, update, { session });
    } else if (targetType === REVIEW_TARGET_TYPES.SUPPLIER) {
      await SupplierProfile.updateOne({ _id: targetId }, update, { session });
    } else {
      await Product.updateOne({ _id: targetId }, update, { session });
    }
  }
}
