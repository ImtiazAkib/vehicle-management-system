import { MAINTENANCE_SCHEDULE_STATUSES } from '@/constants/enums.const';

import type { MaintenanceScheduleStatus } from '@/types';

const DEFAULT_DUE_WINDOW_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type ScheduleDueInput = {
  /** When the service is next due by the calendar. */
  nextDueDate: Date;
  /** The odometer reading it is next due at, if the schedule is mileage-driven. */
  nextDueMileage?: number | null;
  /** The vehicle's current odometer reading. */
  currentMileage: number;
  /** The instant to evaluate against — passed in, never read from the clock, so this stays pure. */
  now: Date;
  /** How many days before the due date the schedule turns DUE. */
  dueWindowDays?: number;
};

/**
 * Decide a maintenance schedule's status from the calendar and the odometer.
 *
 * Pure — the clock is an argument, so the same inputs always give the same answer, which is what lets the
 * unit test pin every boundary. It is the one piece of judgement the reminder sweep leans on, so a wrong
 * answer here is a reminder that never fires or fires forever.
 *
 * OVERDUE once the due date has passed or the due mileage has been reached; DUE inside the window before
 * the due date; UPCOMING otherwise. A `null` due mileage means the schedule is time-driven only and the
 * odometer is ignored.
 *
 * @param input - The due date and mileage, the current mileage, the evaluation instant, and the window.
 *
 * @returns The schedule's status.
 */
export function computeScheduleStatus(input: ScheduleDueInput): MaintenanceScheduleStatus {
  const windowDays = input.dueWindowDays ?? DEFAULT_DUE_WINDOW_DAYS;

  const pastDueDate = input.now.getTime() > input.nextDueDate.getTime();
  const reachedDueMileage = typeof input.nextDueMileage === 'number' && input.currentMileage >= input.nextDueMileage;

  if (pastDueDate || reachedDueMileage) {
    return MAINTENANCE_SCHEDULE_STATUSES.OVERDUE;
  }

  const daysUntilDue = (input.nextDueDate.getTime() - input.now.getTime()) / MS_PER_DAY;

  if (daysUntilDue <= windowDays) {
    return MAINTENANCE_SCHEDULE_STATUSES.DUE;
  }

  return MAINTENANCE_SCHEDULE_STATUSES.UPCOMING;
}
