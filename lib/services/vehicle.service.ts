import { Vehicle } from '@/models/vehicle.model';
import { VehicleDto, vehicleFromEntity } from '@/types';

import { CODES } from '@/constants/codes.const';

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
import type { VehicleCreateOutput } from '@/lib/schemas';

import type { VehicleEntity } from '@/models/vehicle.model';

const log = createLoggerWithContext('vehicle.service');

const BUSINESS = CODES.BUSINESS.VEHICLES;
const DATABASE = CODES.DATABASE.VEHICLES;
const VALIDATION = CODES.VALIDATION.VEHICLES;

/** Which unique field a Mongo duplicate-key error is about, or null when the error is something else. */
function duplicateKeyField(error: unknown): string | null {
  if (error && typeof error === 'object' && 'code' in error && error.code === 11000 && 'keyPattern' in error) {
    const keyPattern = error.keyPattern;

    if (keyPattern && typeof keyPattern === 'object') {
      const [field] = Object.keys(keyPattern);

      return field ?? null;
    }
  }

  return null;
}

/**
 * An owner's vehicles. Every method is scoped to the owner: a vehicle only ever reaches the owner it
 * belongs to, enforced in the query rather than checked afterward.
 */
export class VehicleService {
  /**
   * List an owner's vehicles, newest first.
   *
   * @param ownerId - The signed-in owner.
   *
   * @returns The vehicles, or a failure.
   */
  public async list(ownerId: string): Promise<ListResult<VehicleDto>> {
    try {
      await connectToDatabase();

      const vehicles = await Vehicle.find({ owner: ownerId }).sort({ createdAt: -1 }).lean<VehicleEntity[]>();

      return listSuccess(vehicles.map(vehicleFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing vehicles failed');

      return listFailure(createError(DATABASE.READ_FAILED.CODE, DATABASE.READ_FAILED.MESSAGE));
    }
  }

  /**
   * Register a vehicle for an owner. A duplicate VIN or registration number is refused with a field-level
   * message; the unique indexes are what make that true even under a race.
   *
   * @param ownerId - The signed-in owner.
   * @param input - Validated vehicle fields.
   *
   * @returns The created vehicle, or a failure.
   */
  public async create(ownerId: string, input: VehicleCreateOutput): Promise<SingleResult<VehicleDto>> {
    try {
      await connectToDatabase();

      const vehicle = await Vehicle.create({ ...input, owner: ownerId });

      return singleSuccess(vehicleFromEntity(vehicle));
    } catch (error) {
      const field = duplicateKeyField(error);

      if (field === 'vin') {
        return singleFailure(createError(BUSINESS.DUPLICATE_VIN.CODE, BUSINESS.DUPLICATE_VIN.MESSAGE, 'vin'));
      }

      if (field === 'registrationNo') {
        return singleFailure(createError(BUSINESS.DUPLICATE_REGISTRATION.CODE, BUSINESS.DUPLICATE_REGISTRATION.MESSAGE, 'registrationNo'));
      }

      log.error({ err: error }, 'Creating a vehicle failed');

      return singleFailure(createError(DATABASE.WRITE_FAILED.CODE, DATABASE.WRITE_FAILED.MESSAGE));
    }
  }

  /**
   * Remove an owner's vehicle. Scoped to the owner, so one owner cannot delete another's by id.
   *
   * @param ownerId - The signed-in owner.
   * @param vehicleId - The vehicle to remove.
   *
   * @returns Empty success, or a failure.
   */
  public async remove(ownerId: string, vehicleId: string): Promise<EmptyResult> {
    try {
      await connectToDatabase();

      const deleted = await Vehicle.deleteOne({ _id: vehicleId, owner: ownerId });

      if (deleted.deletedCount === 0) {
        return emptyFailureWithError(createError(VALIDATION.NOT_FOUND.CODE, VALIDATION.NOT_FOUND.MESSAGE));
      }

      return emptySuccess();
    } catch (error) {
      log.error({ err: error }, 'Removing a vehicle failed');

      return emptyFailureWithError(createError(DATABASE.WRITE_FAILED.CODE, DATABASE.WRITE_FAILED.MESSAGE));
    }
  }
}
