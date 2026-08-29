import { describe, expect, it } from 'vitest';

import { computeScheduleStatus } from './schedule-due.utils';

/*
  The reminder sweep is only ever as right as this function, so the cases below lean on the boundaries: the
  edge of the due window, the day the date passes, the mileage reached exactly, and a time-driven schedule
  that must ignore the odometer entirely.
*/
const now = new Date('2026-06-01T00:00:00Z');

describe('computeScheduleStatus', () => {
  it('is UPCOMING when the due date is far off and mileage is low', () => {
    expect(computeScheduleStatus({ nextDueDate: new Date('2026-09-01'), currentMileage: 1000, now })).toBe('UPCOMING');
  });

  it('is DUE inside the window before the due date', () => {
    expect(computeScheduleStatus({ nextDueDate: new Date('2026-06-05'), currentMileage: 1000, now })).toBe('DUE');
  });

  it('is OVERDUE once the due date has passed', () => {
    expect(computeScheduleStatus({ nextDueDate: new Date('2026-05-01'), currentMileage: 1000, now })).toBe('OVERDUE');
  });

  it('is OVERDUE when the odometer has reached the due mileage', () => {
    expect(computeScheduleStatus({ nextDueDate: new Date('2026-12-01'), nextDueMileage: 5000, currentMileage: 5000, now })).toBe('OVERDUE');
  });

  it('is UPCOMING when the due mileage is set but not reached and the date is far', () => {
    expect(computeScheduleStatus({ nextDueDate: new Date('2026-12-01'), nextDueMileage: 5000, currentMileage: 4000, now })).toBe('UPCOMING');
  });

  it('respects a custom due window', () => {
    expect(computeScheduleStatus({ nextDueDate: new Date('2026-06-20'), currentMileage: 0, now, dueWindowDays: 30 })).toBe('DUE');
  });

  it('ignores a null due mileage — a time-driven schedule does not look at the odometer', () => {
    expect(computeScheduleStatus({ nextDueDate: new Date('2026-12-01'), nextDueMileage: null, currentMileage: 999999, now })).toBe('UPCOMING');
  });
});
