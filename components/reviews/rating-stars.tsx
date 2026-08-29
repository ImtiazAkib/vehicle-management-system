import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

type RatingStarsProps = {
  rating: number;
  count?: number;
};

/** A read-only five-star rating with an optional count — the badge on a center, supplier or product. */
export function RatingStars({ rating, count }: RatingStarsProps) {
  if (count === 0) {
    return <span className="text-muted-foreground text-sm">No reviews yet</span>;
  }

  const rounded = Math.round(rating);

  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="inline-flex" aria-hidden>
        {[1, 2, 3, 4, 5].map(index => (
          <Star key={index} className={cn('size-4', index <= rounded ? 'fill-warning text-warning' : 'text-muted-foreground/40')} />
        ))}
      </span>
      <span className="text-muted-foreground">
        {rating.toFixed(1)}
        {count != null ? ` (${count})` : ''}
      </span>
    </span>
  );
}
