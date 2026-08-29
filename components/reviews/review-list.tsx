import { RatingStars } from './rating-stars';

import type { ReviewDto } from '@/types';

/** The reviews on a target's surface, newest first. */
export function ReviewList({ reviews }: { reviews: ReviewDto[] }) {
  if (reviews.length === 0) {
    return <p className="text-muted-foreground text-sm">No reviews yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {reviews.map(review => (
        <li key={review.reviewId} className="border-border flex flex-col gap-1 border-b pb-3 last:border-b-0 last:pb-0">
          <div className="flex items-center justify-between gap-2">
            <RatingStars rating={review.rating} />
            <span className="text-muted-foreground text-xs">{new Date(review.createdAt).toLocaleDateString()}</span>
          </div>
          {review.comment && <p className="text-sm">{review.comment}</p>}
        </li>
      ))}
    </ul>
  );
}
