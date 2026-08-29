import { MaintenanceSchedule } from '@/models/maintenance-schedule.model';
import { Notification } from '@/models/notification.model';
import { Vehicle } from '@/models/vehicle.model';
import { MaintenanceScheduleDto, maintenanceScheduleFromEntity } from '@/types';

import { CODES } from '@/constants/codes.const';
import { MAINTENANCE_SCHEDULE_STATUSES, NOTIFICATION_CHANNELS } from '@/constants/enums.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import {
  EmptyResult,
  ListResult,
  SingleResult,
  createError,
  emptyFailureWithError,
  emptySuccess,
  listFailure,
  listSuccess,
  singleFailure,
  singleSuccess,
} from '@/lib/result';
import type { MaintenanceScheduleCreateOutput } from '@/lib/schemas';
import { computeScheduleStatus } from '@/lib/utils';

import type { MaintenanceScheduleEntity } from '@/models/maintenance-schedule.model';
import type { VehicleEntity } from '@/models/vehicle.model';

const log = createLoggerWithContext('maintenance.service');

const DATABASE = CODES.DATABASE.SCHEDULING;
const VALIDATION = CODES.VALIDATION.SCHEDULING;

/** How long a schedule that is still due waits before it reminds again, so a standing overdue does not mail every hour. */
const RENOTIFY_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * Maintenance schedules and the reminder sweep. Owner-facing methods are scoped to the owner's vehicles;
 * the sweep runs as a separate cron process and touches every vehicle.
 */
export class MaintenanceService {
  /**
   * An owner's schedules across all their vehicles, soonest due first.
   *
   * @param ownerId - The signed-in owner.
   *
   * @returns The schedules, or a failure.
   */
  public async listForOwner(ownerId: string): Promise<ListResult<MaintenanceScheduleDto>> {
    try {
      await connectToDatabase();

      const vehicleIds = await Vehicle.find({ owner: ownerId }).distinct('_id');
      const schedules = await MaintenanceSchedule.find({ vehicle: { $in: vehicleIds } })
        .sort({ nextDueDate: 1 })
        .lean<MaintenanceScheduleEntity[]>();

      return listSuccess(schedules.map(maintenanceScheduleFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing schedules failed');

      return listFailure(createError(DATABASE.READ_FAILED.CODE, DATABASE.READ_FAILED.MESSAGE));
    }
  }

  /**
   * Add a schedule to one of the owner's vehicles, with its status computed from the due date and the
   * vehicle's current mileage.
   *
   * @param ownerId - The signed-in owner.
   * @param input - Validated schedule fields, including the vehicle id.
   *
   * @returns The created schedule, or a failure.
   */
  public async create(ownerId: string, input: MaintenanceScheduleCreateOutput): Promise<SingleResult<MaintenanceScheduleDto>> {
    try {
      await connectToDatabase();

      const vehicle = await Vehicle.findOne({ _id: input.vehicleId, owner: ownerId }).lean<VehicleEntity | null>();

      if (!vehicle) {
        return singleFailure(createError(VALIDATION.VEHICLE_NOT_FOUND.CODE, VALIDATION.VEHICLE_NOT_FOUND.MESSAGE));
      }

      const status = computeScheduleStatus({
        nextDueDate: input.nextDueDate,
        nextDueMileage: input.nextDueMileage ?? null,
        currentMileage: vehicle.currentMileage,
        now: new Date(),
      });

      const schedule = await MaintenanceSchedule.create({
        vehicle: vehicle._id,
        serviceType: input.serviceType,
        intervalMonths: input.intervalMonths,
        intervalMileage: input.intervalMileage,
        nextDueDate: input.nextDueDate,
        nextDueMileage: input.nextDueMileage,
        status,
      });

      return singleSuccess(maintenanceScheduleFromEntity(schedule));
    } catch (error) {
      log.error({ err: error }, 'Creating a schedule failed');

      return singleFailure(createError(DATABASE.WRITE_FAILED.CODE, DATABASE.WRITE_FAILED.MESSAGE));
    }
  }

  /**
   * Remove one of the owner's schedules, scoped through the owner's vehicles.
   *
   * @param ownerId - The signed-in owner.
   * @param scheduleId - The schedule to remove.
   *
   * @returns Empty success, or a failure.
   */
  public async remove(ownerId: string, scheduleId: string): Promise<EmptyResult> {
    try {
      await connectToDatabase();

      const vehicleIds = await Vehicle.find({ owner: ownerId }).distinct('_id');
      const deleted = await MaintenanceSchedule.deleteOne({ _id: scheduleId, vehicle: { $in: vehicleIds } });

      if (deleted.deletedCount === 0) {
        return emptyFailureWithError(createError(VALIDATION.SCHEDULE_NOT_FOUND.CODE, VALIDATION.SCHEDULE_NOT_FOUND.MESSAGE));
      }

      return emptySuccess();
    } catch (error) {
      log.error({ err: error }, 'Removing a schedule failed');

      return emptyFailureWithError(createError(DATABASE.WRITE_FAILED.CODE, DATABASE.WRITE_FAILED.MESSAGE));
    }
  }

  /**
   * The reminder sweep — the cron entrypoint. It recomputes every non-completed schedule's status, and for
   * one that is due or overdue and has not been reminded recently it writes an in-app notification and
   * stamps `lastNotifiedAt`, so a standing overdue reminds once a window rather than every run.
   *
   * @param now - The instant to evaluate against; defaults to the current time.
   *
   * @returns How many schedules were processed and how many reminders were sent.
   */
  public async runReminderSweep(now: Date = new Date()): Promise<{ processed: number; notified: number }> {
    await connectToDatabase();

    const schedules = await MaintenanceSchedule.find({ status: { $ne: MAINTENANCE_SCHEDULE_STATUSES.COMPLETED } });
    let notified = 0;

    for (const schedule of schedules) {
      const vehicle = await Vehicle.findById(schedule.vehicle).lean<VehicleEntity | null>();

      if (!vehicle) {
        continue;
      }

      const status = computeScheduleStatus({
        nextDueDate: schedule.nextDueDate,
        nextDueMileage: schedule.nextDueMileage ?? null,
        currentMileage: vehicle.currentMileage,
        now,
      });

      if (status !== schedule.status) {
        schedule.set({ status });
      }

      const isDue = status === MAINTENANCE_SCHEDULE_STATUSES.DUE || status === MAINTENANCE_SCHEDULE_STATUSES.OVERDUE;
      const remindedRecently = schedule.lastNotifiedAt != null && now.getTime() - schedule.lastNotifiedAt.getTime() < RENOTIFY_AFTER_MS;

      if (isDue && !remindedRecently) {
        const overdue = status === MAINTENANCE_SCHEDULE_STATUSES.OVERDUE;

        await Notification.create({
          user: vehicle.owner,
          type: 'maintenance-reminder',
          title: `${schedule.serviceType} is ${overdue ? 'overdue' : 'due'}`,
          body: `Your ${vehicle.year} ${vehicle.make} ${vehicle.model} is ${overdue ? 'overdue' : 'due'} for ${schedule.serviceType}.`,
          channel: NOTIFICATION_CHANNELS.IN_APP,
          isRead: false,
        });

        schedule.set({ lastNotifiedAt: now });
        notified += 1;
      }

      if (schedule.isModified()) {
        await schedule.save();
      }
    }

    return { processed: schedules.length, notified };
  }
}
