import { describe, expect, it } from 'vitest';

import { computeRatingAggregate } from './rating.utils';

describe('computeRatingAggregate', () => {
  it('is zero over zero for no reviews', () => {
    expect(computeRatingAggregate([])).toEqual({ ratingAvg: 0, ratingCount: 0 });
  });

  it('returns the single rating', () => {
    expect(computeRatingAggregate([5])).toEqual({ ratingAvg: 5, ratingCount: 1 });
  });

  it('averages a clean pair', () => {
    expect(computeRatingAggregate([4, 5])).toEqual({ ratingAvg: 4.5, ratingCount: 2 });
  });

  it('rounds the mean to two decimals', () => {
    expect(computeRatingAggregate([1, 2, 4])).toEqual({ ratingAvg: 2.33, ratingCount: 3 });
  });

  it('re-aggregates from the current rows, ignoring order', () => {
    expect(computeRatingAggregate([5, 3, 1, 3])).toEqual({ ratingAvg: 3, ratingCount: 4 });
  });
});
