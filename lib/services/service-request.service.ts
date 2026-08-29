import { Types } from 'mongoose';

import { ServiceCenterProfile } from '@/models/service-center-profile.model';
import { ServiceRequest } from '@/models/service-request.model';
import { Vehicle } from '@/models/vehicle.model';
import { ServiceCenterProfileDto, ServiceRequestDto, serviceCenterProfileFromEntity, serviceRequestFromEntity } from '@/types';

import { CODES } from '@/constants/codes.const';
import { SERVICE_REQUEST_STATUSES } from '@/constants/enums.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import { ListResult, SingleResult, createError, listFailure, listSuccess, singleFailure, singleSuccess } from '@/lib/result';
import type { ErrorDto } from '@/lib/result';
import type { BookingCreateOutput, BookingTransitionOutput } from '@/lib/schemas';
import { BOOKING_ACTION_ACTORS, canTransition, toId } from '@/lib/utils';

import { MaintenanceService } from './maintenance.service';
import { NotificationService } from './notification.service';

import type { ServiceCenterProfileEntity } from '@/models/service-center-profile.model';
import type { ServiceRequestEntity } from '@/models/service-request.model';
import type { VehicleEntity } from '@/models/vehicle.model';

const log = createLoggerWithContext('service-request.service');

const DATABASE = CODES.DATABASE.BOOKINGS;
const VALIDATION = CODES.VALIDATION.BOOKINGS;
const BUSINESS = CODES.BUSINESS.BOOKINGS;

/**
 * Service bookings and their guarded lifecycle. A booking's status is never written by hand: every move
 * goes through {@link transition}, which asks the pure {@link canTransition} guard whether the edge is
 * legal and refuses otherwise. Owner-facing and center-facing reads are each scoped to the requester.
 */
const TRANSITION_MESSAGES: Record<BookingTransitionOutput['action'], string> = {
  accept: 'Your booking was accepted.',
  decline: 'Your booking was declined.',
  start: 'Work has started on your booking.',
  complete: 'Your booking is complete.',
  cancel: 'A booking was cancelled.',
};

export class ServiceRequestService {
  private readonly maintenance = new MaintenanceService();
  private readonly notifications = new NotificationService();

  /**
   * An owner's bookings across all their vehicles, newest first.
   *
   * @param ownerId - The signed-in owner.
   *
   * @returns The bookings, or a failure.
   */
  public async findForOwner(ownerId: string): Promise<ListResult<ServiceRequestDto>> {
    try {
      await connectToDatabase();

      const requests = await ServiceRequest.find({ owner: ownerId }).sort({ createdAt: -1 }).lean<ServiceRequestEntity[]>();

      return listSuccess(requests.map(serviceRequestFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing owner bookings failed');

      return listFailure(createError(DATABASE.READ_FAILED.CODE, DATABASE.READ_FAILED.MESSAGE));
    }
  }

  /**
   * The centers an owner may book — those an admin has verified, by name. The booking form offers only
   * these, and {@link create} re-checks the choice, so an unverified center is unbookable from both ends.
   *
   * @returns The verified centers, or a failure.
   */
  public async listVerifiedCenters(): Promise<ListResult<ServiceCenterProfileDto>> {
    try {
      await connectToDatabase();

      const centers = await ServiceCenterProfile.find({ isVerified: true }).sort({ centerName: 1 }).lean<ServiceCenterProfileEntity[]>();

      return listSuccess(centers.map(serviceCenterProfileFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing verified centers failed');

      return listFailure(createError(DATABASE.READ_FAILED.CODE, DATABASE.READ_FAILED.MESSAGE));
    }
  }

  /**
   * The bookings assigned to a center, newest first. Scoped through the center's own profile, so one
   * center never sees another's queue.
   *
   * @param centerUserId - The signed-in service-center account.
   *
   * @returns The bookings, or a failure. An account without a center profile yet lists nothing.
   */
  public async findForCenter(centerUserId: string): Promise<ListResult<ServiceRequestDto>> {
    try {
      await connectToDatabase();

      const profileId = await this.resolveCenterProfileId(centerUserId);

      if (!profileId) {
        return listSuccess([]);
      }

      const requests = await ServiceRequest.find({ serviceCenter: profileId }).sort({ createdAt: -1 }).lean<ServiceRequestEntity[]>();

      return listSuccess(requests.map(serviceRequestFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing center bookings failed');

      return listFailure(createError(DATABASE.READ_FAILED.CODE, DATABASE.READ_FAILED.MESSAGE));
    }
  }

  /**
   * Book a service. The vehicle must belong to the owner and the center must be one an admin has verified
   * — both checked against the database, not the form, so a hand-edited request naming an unverified
   * center is refused. The booking starts PENDING.
   *
   * @param ownerId - The signed-in owner.
   * @param input - Validated booking fields.
   *
   * @returns The created booking, or a failure.
   */
  public async create(ownerId: string, input: BookingCreateOutput): Promise<SingleResult<ServiceRequestDto>> {
    try {
      await connectToDatabase();

      const vehicle = await Vehicle.findOne({ _id: input.vehicleId, owner: ownerId }).lean<VehicleEntity | null>();

      if (!vehicle) {
        return singleFailure(createError(VALIDATION.VEHICLE_NOT_FOUND.CODE, VALIDATION.VEHICLE_NOT_FOUND.MESSAGE));
      }

      const center = await ServiceCenterProfile.findById(input.serviceCenterId).lean<ServiceCenterProfileEntity | null>();

      if (!center) {
        return singleFailure(createError(VALIDATION.CENTER_NOT_FOUND.CODE, VALIDATION.CENTER_NOT_FOUND.MESSAGE));
      }

      if (!center.isVerified) {
        return singleFailure(createError(BUSINESS.CENTER_NOT_VERIFIED.CODE, BUSINESS.CENTER_NOT_VERIFIED.MESSAGE));
      }

      const request = await ServiceRequest.create({
        vehicle: vehicle._id,
        owner: ownerId,
        serviceCenter: center._id,
        serviceType: input.serviceType,
        description: input.description,
        priority: input.priority,
        preferredDate: input.preferredDate,
        status: SERVICE_REQUEST_STATUSES.PENDING,
      });

      return singleSuccess(serviceRequestFromEntity(request));
    } catch (error) {
      log.error({ err: error }, 'Creating a booking failed');

      return singleFailure(createError(DATABASE.WRITE_FAILED.CODE, DATABASE.WRITE_FAILED.MESSAGE));
    }
  }

  /**
   * Move a booking along one legal edge. The actor must own the booking (for `cancel`) or be its assigned
   * center (for the rest); the {@link canTransition} guard decides whether the edge is legal at all; and
   * the action's own required fields — a date and estimate for `accept`, a final cost for `complete` — are
   * applied as the status changes. Anything off the graph is refused with `ILLEGAL_TRANSITION`.
   *
   * @param actorUserId - The signed-in account attempting the move.
   * @param input - The action and its required fields, already validated.
   *
   * @returns The updated booking, or a failure.
   */
  public async transition(actorUserId: string, input: BookingTransitionOutput): Promise<SingleResult<ServiceRequestDto>> {
    try {
      await connectToDatabase();

      const request = await ServiceRequest.findById(input.serviceRequestId);

      if (!request) {
        return singleFailure(createError(VALIDATION.REQUEST_NOT_FOUND.CODE, VALIDATION.REQUEST_NOT_FOUND.MESSAGE));
      }

      const denial = await this.authorize(actorUserId, input.action, request);

      if (denial) {
        return singleFailure(denial);
      }

      const next = canTransition(request.status, input.action);

      if (!next) {
        return singleFailure(createError(BUSINESS.ILLEGAL_TRANSITION.CODE, BUSINESS.ILLEGAL_TRANSITION.MESSAGE));
      }

      if (input.action === 'accept') {
        request.scheduledDate = input.scheduledDate;
        request.estimatedCost = input.estimatedCost;
      }

      if (input.action === 'complete') {
        request.finalCost = input.finalCost;

        // Write the durable maintenance record before the status is persisted, so a completed booking
        // always has exactly one record — a later save failure leaves the booking IN_PROGRESS to retry.
        await this.maintenance.recordCompletion({
          vehicleId: request.vehicle,
          serviceRequestId: request._id,
          serviceCenterId: request.serviceCenter,
          serviceType: request.serviceType,
          cost: input.finalCost,
          mileageAtService: input.mileageAtService,
          notes: input.notes,
          performedOn: new Date(),
        });
      }

      request.status = next;
      await request.save();

      await this.notifyTransition(input.action, request);

      return singleSuccess(serviceRequestFromEntity(request));
    } catch (error) {
      log.error({ err: error }, 'Transitioning a booking failed');

      return singleFailure(createError(DATABASE.WRITE_FAILED.CODE, DATABASE.WRITE_FAILED.MESSAGE));
    }
  }

  /**
   * Check that the actor is allowed to touch this booking for this action: the owner for `cancel`, the
   * assigned center for the rest.
   *
   * @returns An error to fail with, or `null` when the actor is allowed.
   */
  private async authorize(
    actorUserId: string,
    action: BookingTransitionOutput['action'],
    request: Pick<ServiceRequestEntity, 'owner' | 'serviceCenter'>
  ): Promise<ErrorDto | null> {
    if (BOOKING_ACTION_ACTORS[action] === 'owner') {
      if (toId(request.owner) !== actorUserId) {
        return createError(BUSINESS.NOT_OWNER.CODE, BUSINESS.NOT_OWNER.MESSAGE);
      }

      return null;
    }

    const profileId = await this.resolveCenterProfileId(actorUserId);

    if (!profileId || toId(request.serviceCenter) !== profileId) {
      return createError(BUSINESS.NOT_ASSIGNED_CENTER.CODE, BUSINESS.NOT_ASSIGNED_CENTER.MESSAGE);
    }

    return null;
  }

  /** Notify the party a transition affects: the owner on a center's move, the center on the owner's cancel. */
  private async notifyTransition(
    action: BookingTransitionOutput['action'],
    request: Pick<ServiceRequestEntity, '_id' | 'owner' | 'serviceCenter' | 'serviceType'>
  ): Promise<void> {
    const body = TRANSITION_MESSAGES[action];
    const data = { serviceRequestId: toId(request._id) };

    if (action === 'cancel') {
      const profile = await ServiceCenterProfile.findById(request.serviceCenter).select('user').lean<{ user: Types.ObjectId } | null>();

      if (profile) {
        await this.notifications.create({ userId: toId(profile.user), type: 'booking', title: request.serviceType, body, data });
      }

      return;
    }

    await this.notifications.create({ userId: toId(request.owner), type: 'booking', title: request.serviceType, body, data });
  }

  /** The `ServiceCenterProfile` id for a center account, or null when the account has no profile yet. */
  private async resolveCenterProfileId(userId: string): Promise<string | null> {
    const profile = await ServiceCenterProfile.findOne({ user: userId }).select('_id').lean<{ _id: Types.ObjectId } | null>();

    return profile ? toId(profile._id) : null;
  }
}
