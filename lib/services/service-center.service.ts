import { Types } from 'mongoose';

import { MaintenanceRecord } from '@/models/maintenance-record.model';
import { ServiceCenterProfile } from '@/models/service-center-profile.model';
import { MaintenanceRecordDto, ServiceCenterProfileDto, maintenanceRecordFromEntity, serviceCenterProfileFromEntity } from '@/types';

import { CODES } from '@/constants/codes.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import { ListResult, SingleResult, createError, listFailure, listSuccess, singleFailure, singleSuccess } from '@/lib/result';
import type { ServiceCenterProfileOutput } from '@/lib/schemas';
import { toId } from '@/lib/utils';

import type { MaintenanceRecordEntity } from '@/models/maintenance-record.model';
import type { ServiceCenterProfileEntity } from '@/models/service-center-profile.model';

const log = createLoggerWithContext('service-center.service');

const USERS_DATABASE = CODES.DATABASE.USERS;
const USERS_VALIDATION = CODES.VALIDATION.USERS;
const SCHEDULING_DATABASE = CODES.DATABASE.SCHEDULING;

/**
 * The `ServiceCenterProfile` id for a center account, or null when the account has no profile yet. Shared
 * so every center-scoped read and write resolves "whose center is this" the same way.
 *
 * @param userId - The signed-in service-center account.
 *
 * @returns The profile id, or null.
 */
export async function resolveCenterProfileId(userId: string): Promise<string | null> {
  const profile = await ServiceCenterProfile.findOne({ user: userId }).select('_id').lean<{ _id: Types.ObjectId } | null>();

  return profile ? toId(profile._id) : null;
}

/**
 * A service center's own profile and history. Every method is scoped to the requesting center's profile —
 * a center reads and writes only what is theirs, the same scoping the booking transitions enforce.
 */
export class ServiceCenterService {
  /**
   * The signed-in center's own profile.
   *
   * @param centerUserId - The signed-in service-center account.
   *
   * @returns The profile, or a failure.
   */
  public async getOwnProfile(centerUserId: string): Promise<SingleResult<ServiceCenterProfileDto>> {
    try {
      await connectToDatabase();

      const profile = await ServiceCenterProfile.findOne({ user: centerUserId }).lean<ServiceCenterProfileEntity | null>();

      if (!profile) {
        return singleFailure(createError(USERS_VALIDATION.PROFILE_NOT_FOUND.CODE, USERS_VALIDATION.PROFILE_NOT_FOUND.MESSAGE));
      }

      return singleSuccess(serviceCenterProfileFromEntity(profile));
    } catch (error) {
      log.error({ err: error }, 'Loading center profile failed');

      return singleFailure(createError(USERS_DATABASE.READ_FAILED.CODE, USERS_DATABASE.READ_FAILED.MESSAGE));
    }
  }

  /**
   * Update the signed-in center's own profile. `isVerified` is not among the writable fields — admin
   * verification is not something a center can grant itself.
   *
   * @param centerUserId - The signed-in service-center account.
   * @param input - Validated profile fields.
   *
   * @returns The updated profile, or a failure.
   */
  public async updateOwnProfile(centerUserId: string, input: ServiceCenterProfileOutput): Promise<SingleResult<ServiceCenterProfileDto>> {
    try {
      await connectToDatabase();

      const profile = await ServiceCenterProfile.findOneAndUpdate(
        { user: centerUserId },
        { $set: input },
        { new: true }
      ).lean<ServiceCenterProfileEntity | null>();

      if (!profile) {
        return singleFailure(createError(USERS_VALIDATION.PROFILE_NOT_FOUND.CODE, USERS_VALIDATION.PROFILE_NOT_FOUND.MESSAGE));
      }

      return singleSuccess(serviceCenterProfileFromEntity(profile));
    } catch (error) {
      log.error({ err: error }, 'Updating center profile failed');

      return singleFailure(createError(USERS_DATABASE.UPDATE_FAILED.CODE, USERS_DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  /**
   * The maintenance records written by the signed-in center, newest first — its permanent log of work
   * done, scoped to its own profile.
   *
   * @param centerUserId - The signed-in service-center account.
   *
   * @returns The records, or a failure. An account without a profile yet lists nothing.
   */
  public async recordsForCenter(centerUserId: string): Promise<ListResult<MaintenanceRecordDto>> {
    try {
      await connectToDatabase();

      const profileId = await resolveCenterProfileId(centerUserId);

      if (!profileId) {
        return listSuccess([]);
      }

      const records = await MaintenanceRecord.find({ serviceCenter: profileId }).sort({ performedOn: -1 }).lean<MaintenanceRecordEntity[]>();

      return listSuccess(records.map(maintenanceRecordFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing center records failed');

      return listFailure(createError(SCHEDULING_DATABASE.READ_FAILED.CODE, SCHEDULING_DATABASE.READ_FAILED.MESSAGE));
    }
  }
}
