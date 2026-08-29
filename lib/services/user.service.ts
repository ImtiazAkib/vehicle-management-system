import { ServiceCenterProfile } from '@/models/service-center-profile.model';
import { SupplierProfile } from '@/models/supplier-profile.model';
import { User } from '@/models/user.model';
import {
  ServiceCenterProfileDto,
  SupplierProfileDto,
  UserDto,
  serviceCenterProfileFromEntity,
  supplierProfileFromEntity,
  userFromEntity,
} from '@/types';

import { CODES } from '@/constants/codes.const';
import { USER_ROLES } from '@/constants/roles.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import { EmptyResult, ListResult, createError, emptyFailureWithError, emptySuccess, listFailure, listSuccess } from '@/lib/result';

import type { ServiceCenterProfileEntity } from '@/models/service-center-profile.model';
import type { SupplierProfileEntity } from '@/models/supplier-profile.model';
import type { UserEntity } from '@/models/user.model';

const log = createLoggerWithContext('user.service');

const BUSINESS = CODES.BUSINESS.USERS;
const DATABASE = CODES.DATABASE.USERS;

/**
 * The administrator's view of accounts: read them, deactivate them, and verify the businesses among them.
 * It performs no business action on anyone's behalf — the super administrator is untouchable here, and a
 * verification is the one flag it flips.
 */
export class UserService {
  /**
   * Every account, newest first — the admin users screen.
   *
   * @returns The users, or a failure.
   */
  public async list(): Promise<ListResult<UserDto>> {
    try {
      await connectToDatabase();

      const users = await User.find().sort({ createdAt: -1 }).lean<UserEntity[]>();

      return listSuccess(users.map(userFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing users failed');

      return listFailure(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  /**
   * Activate or deactivate an account. The super administrator cannot be deactivated — it is the one
   * account that must always be able to reach the platform.
   *
   * @param userId - The account to change.
   * @param isActive - The state to set.
   *
   * @returns Empty success, or a failure.
   */
  public async setActive(userId: string, isActive: boolean): Promise<EmptyResult> {
    try {
      await connectToDatabase();

      const user = await User.findById(userId).lean<UserEntity | null>();

      if (!user) {
        return emptyFailureWithError(createError(BUSINESS.ACCOUNT_NOT_FOUND.CODE, BUSINESS.ACCOUNT_NOT_FOUND.MESSAGE));
      }

      if (user.role === USER_ROLES.SUPER_ADMIN) {
        return emptyFailureWithError(createError(BUSINESS.UPDATE_FAILED.CODE, 'The super administrator cannot be deactivated.'));
      }

      await User.updateOne({ _id: userId }, { $set: { isActive } });

      return emptySuccess();
    } catch (error) {
      log.error({ err: error }, 'Setting an account active state failed');

      return emptyFailureWithError(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  /**
   * The service-center profiles, optionally only the ones still awaiting verification.
   *
   * @param onlyUnverified - When true, list only unverified profiles.
   *
   * @returns The profiles, or a failure.
   */
  public async listServiceCenters(onlyUnverified = false): Promise<ListResult<ServiceCenterProfileDto>> {
    try {
      await connectToDatabase();

      const filter = onlyUnverified ? { isVerified: false } : {};
      const profiles = await ServiceCenterProfile.find(filter).sort({ createdAt: -1 }).lean<ServiceCenterProfileEntity[]>();

      return listSuccess(profiles.map(serviceCenterProfileFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing service centers failed');

      return listFailure(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  /**
   * The supplier profiles, optionally only the ones still awaiting verification.
   *
   * @param onlyUnverified - When true, list only unverified profiles.
   *
   * @returns The profiles, or a failure.
   */
  public async listSuppliers(onlyUnverified = false): Promise<ListResult<SupplierProfileDto>> {
    try {
      await connectToDatabase();

      const filter = onlyUnverified ? { isVerified: false } : {};
      const profiles = await SupplierProfile.find(filter).sort({ createdAt: -1 }).lean<SupplierProfileEntity[]>();

      return listSuccess(profiles.map(supplierProfileFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing suppliers failed');

      return listFailure(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  /**
   * Verify a service center — the flag that makes it transactable. Bookings against an unverified center
   * are refused in the booking service.
   *
   * @param profileId - The profile to verify.
   *
   * @returns Empty success, or a failure.
   */
  public async verifyServiceCenter(profileId: string): Promise<EmptyResult> {
    try {
      await connectToDatabase();

      const updated = await ServiceCenterProfile.updateOne({ _id: profileId }, { $set: { isVerified: true } });

      return this.fromMatched(updated.matchedCount);
    } catch (error) {
      log.error({ err: error }, 'Verifying a service center failed');

      return emptyFailureWithError(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  /**
   * Verify a supplier — the flag that makes it transactable. An unverified supplier's products are not
   * browsable and it cannot receive orders.
   *
   * @param profileId - The profile to verify.
   *
   * @returns Empty success, or a failure.
   */
  public async verifySupplier(profileId: string): Promise<EmptyResult> {
    try {
      await connectToDatabase();

      const updated = await SupplierProfile.updateOne({ _id: profileId }, { $set: { isVerified: true } });

      return this.fromMatched(updated.matchedCount);
    } catch (error) {
      log.error({ err: error }, 'Verifying a supplier failed');

      return emptyFailureWithError(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  private fromMatched(matchedCount: number): EmptyResult {
    if (matchedCount === 0) {
      return emptyFailureWithError(createError(BUSINESS.ACCOUNT_NOT_FOUND.CODE, BUSINESS.ACCOUNT_NOT_FOUND.MESSAGE));
    }

    return emptySuccess();
  }
}
