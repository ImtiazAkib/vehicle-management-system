export type RatingAggregate = {
  ratingAvg: number;
  ratingCount: number;
};

/**
 * Re-derive a target's rating aggregate from the surviving review ratings.
 *
 * A re-aggregation, never a running `+=` / `-=`: an edited or removed review cannot corrupt a total that
 * does not exist, because there is only the current rows and their mean. The average is rounded to two
 * decimals; an empty set is 0 over 0.
 *
 * @param ratings - The ratings of every current review for the target.
 *
 * @returns The mean and the count.
 */
export function computeRatingAggregate(ratings: number[]): RatingAggregate {
  const ratingCount = ratings.length;

  if (ratingCount === 0) {
    return { ratingAvg: 0, ratingCount: 0 };
  }

  const sum = ratings.reduce((total, rating) => total + rating, 0);
  const ratingAvg = Math.round((sum / ratingCount) * 100) / 100;

  return { ratingAvg, ratingCount };
}
