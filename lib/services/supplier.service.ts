import { Types } from 'mongoose';

import { SupplierProfile } from '@/models/supplier-profile.model';
import { SupplierProfileDto, supplierProfileFromEntity } from '@/types';

import { CODES } from '@/constants/codes.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import { ListResult, SingleResult, createError, listFailure, listSuccess, singleFailure, singleSuccess } from '@/lib/result';
import type { SupplierProfileOutput } from '@/lib/schemas';
import { toId } from '@/lib/utils';

import type { SupplierProfileEntity } from '@/models/supplier-profile.model';

const log = createLoggerWithContext('supplier.service');

const USERS_DATABASE = CODES.DATABASE.USERS;
const USERS_VALIDATION = CODES.VALIDATION.USERS;
const MARKETPLACE_DATABASE = CODES.DATABASE.MARKETPLACE;

/**
 * The `SupplierProfile` id for a supplier account, or null when the account has no profile yet. Shared so
 * every supplier-scoped read and write resolves "whose catalog is this" the same way.
 *
 * @param userId - The signed-in supplier account.
 *
 * @returns The profile id, or null.
 */
export async function resolveSupplierProfileId(userId: string): Promise<string | null> {
  const profile = await SupplierProfile.findOne({ user: userId }).select('_id').lean<{ _id: Types.ObjectId } | null>();

  return profile ? toId(profile._id) : null;
}

/**
 * A supplier's own profile, and the public directory of verified sellers. Admin verification of a supplier
 * lives in {@link UserService}; this service is the supplier's own view and the buyer-facing directory.
 */
export class SupplierService {
  /**
   * The signed-in supplier's own profile.
   *
   * @param supplierUserId - The signed-in supplier account.
   *
   * @returns The profile, or a failure.
   */
  public async getOwnProfile(supplierUserId: string): Promise<SingleResult<SupplierProfileDto>> {
    try {
      await connectToDatabase();

      const profile = await SupplierProfile.findOne({ user: supplierUserId }).lean<SupplierProfileEntity | null>();

      if (!profile) {
        return singleFailure(createError(USERS_VALIDATION.PROFILE_NOT_FOUND.CODE, USERS_VALIDATION.PROFILE_NOT_FOUND.MESSAGE));
      }

      return singleSuccess(supplierProfileFromEntity(profile));
    } catch (error) {
      log.error({ err: error }, 'Loading supplier profile failed');

      return singleFailure(createError(USERS_DATABASE.READ_FAILED.CODE, USERS_DATABASE.READ_FAILED.MESSAGE));
    }
  }

  /**
   * Update the signed-in supplier's own profile. `isVerified` is not writable — verification is granted by
   * an administrator, never self-asserted.
   *
   * @param supplierUserId - The signed-in supplier account.
   * @param input - Validated profile fields.
   *
   * @returns The updated profile, or a failure.
   */
  public async updateOwnProfile(supplierUserId: string, input: SupplierProfileOutput): Promise<SingleResult<SupplierProfileDto>> {
    try {
      await connectToDatabase();

      const profile = await SupplierProfile.findOneAndUpdate(
        { user: supplierUserId },
        { $set: input },
        { new: true }
      ).lean<SupplierProfileEntity | null>();

      if (!profile) {
        return singleFailure(createError(USERS_VALIDATION.PROFILE_NOT_FOUND.CODE, USERS_VALIDATION.PROFILE_NOT_FOUND.MESSAGE));
      }

      return singleSuccess(supplierProfileFromEntity(profile));
    } catch (error) {
      log.error({ err: error }, 'Updating supplier profile failed');

      return singleFailure(createError(USERS_DATABASE.UPDATE_FAILED.CODE, USERS_DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  /**
   * The public directory of verified sellers, by name — the suppliers a buyer's catalog can show.
   *
   * @returns The verified suppliers, or a failure.
   */
  public async listVerified(): Promise<ListResult<SupplierProfileDto>> {
    try {
      await connectToDatabase();

      const suppliers = await SupplierProfile.find({ isVerified: true }).sort({ businessName: 1 }).lean<SupplierProfileEntity[]>();

      return listSuccess(suppliers.map(supplierProfileFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing verified suppliers failed');

      return listFailure(createError(MARKETPLACE_DATABASE.READ_FAILED.CODE, MARKETPLACE_DATABASE.READ_FAILED.MESSAGE));
    }
  }
}
