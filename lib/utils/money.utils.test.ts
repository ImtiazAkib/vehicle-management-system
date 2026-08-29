import { describe, expect, it } from 'vitest';

import { formatMoney, formatPriceLabel, toMinorUnits } from './money.utils';

/*
  Money is stored as an integer count of minor units, and these three helpers are the only
  crossing between that integer and the major-unit text a person types and reads. The whole
  reason for the integer store is that `500.50 * 100` is not `50050` in floating point, so the
  table below leans on the amounts where a float would drift — a fractional price, a round-trip,
  a value that has to stay exact — rather than only the tidy whole numbers.
*/

describe('toMinorUnits', () => {
  it('parses a whole amount', () => {
    expect(toMinorUnits('500')).toBe(50000);
  });

  it('parses an amount with a fraction', () => {
    expect(toMinorUnits('500.50')).toBe(50050);
  });

  it('parses a fraction that a float would round wrong', () => {
    // 500.50 * 100 is 50049.999… in floating point; the integer parse keeps it exact.
    expect(toMinorUnits('500.50')).toBe(50050);
    expect(toMinorUnits('0.07')).toBe(7);
  });

  it('pads a single decimal place', () => {
    expect(toMinorUnits('500.5')).toBe(50050);
  });

  it('treats zero as zero, not as missing', () => {
    expect(toMinorUnits('0')).toBe(0);
    expect(toMinorUnits('0.00')).toBe(0);
  });

  it('tolerates the currency symbol', () => {
    expect(toMinorUnits('৳500.50')).toBe(50050);
  });

  it('tolerates thousands separators and surrounding space', () => {
    expect(toMinorUnits('  ৳ 1,000.00 ')).toBe(100000);
    expect(toMinorUnits('1,250')).toBe(125000);
  });

  it('rejects an empty string as NaN', () => {
    expect(toMinorUnits('')).toBeNaN();
    expect(toMinorUnits('   ')).toBeNaN();
  });

  it('rejects non-numeric text as NaN', () => {
    expect(toMinorUnits('abc')).toBeNaN();
    expect(toMinorUnits('free')).toBeNaN();
  });

  it('rejects more precision than the currency holds', () => {
    expect(toMinorUnits('500.505')).toBeNaN();
  });

  it('rejects a trailing dot', () => {
    expect(toMinorUnits('5.')).toBeNaN();
  });

  it('rejects a negative amount', () => {
    expect(toMinorUnits('-5')).toBeNaN();
  });
});

describe('formatMoney', () => {
  it('renders a fractional amount to fixed precision', () => {
    expect(formatMoney(50050)).toBe('500.50');
  });

  it('always writes the minor digits, so a column lines up', () => {
    expect(formatMoney(50000)).toBe('500.00');
  });

  it('pads a sub-unit amount to a leading zero', () => {
    expect(formatMoney(5)).toBe('0.05');
  });

  it('renders zero as a fixed-precision zero', () => {
    expect(formatMoney(0)).toBe('0.00');
  });

  it('renders a large amount without a separator', () => {
    expect(formatMoney(100000)).toBe('1000.00');
  });

  it('keeps the sign on the whole and does not leak it into the fraction', () => {
    // The `Math.abs` on the fraction is exactly why this is not `-500.-50`.
    expect(formatMoney(-50050)).toBe('-500.50');
  });
});

describe('formatPriceLabel', () => {
  it('reads a zero price as the word Free', () => {
    expect(formatPriceLabel(0)).toBe('Free');
  });

  it('stamps the symbol on a non-zero price', () => {
    expect(formatPriceLabel(50050)).toBe('৳500.50');
  });

  it('labels a sub-unit price', () => {
    expect(formatPriceLabel(5)).toBe('৳0.05');
  });
});

describe('round-trip', () => {
  it('survives major → minor → major', () => {
    expect(formatMoney(toMinorUnits('500.50'))).toBe('500.50');
    expect(formatMoney(toMinorUnits('1,000.00'))).toBe('1000.00');
  });

  it('survives minor → major → minor', () => {
    expect(toMinorUnits(formatMoney(50050))).toBe(50050);
    expect(toMinorUnits(formatMoney(7))).toBe(7);
  });
});
