import mongoose from 'mongoose';

import { MaintenanceRecord } from '@/models/maintenance-record.model';
import { Notification } from '@/models/notification.model';
import { ServiceCenterProfile } from '@/models/service-center-profile.model';
import { ServiceRequest } from '@/models/service-request.model';
import { User } from '@/models/user.model';
import { Vehicle } from '@/models/vehicle.model';

import { CODES } from '@/constants/codes.const';
import { SERVICE_REQUEST_PRIORITIES, SERVICE_REQUEST_STATUSES } from '@/constants/enums.const';
import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';
import type { SingleResult } from '@/lib/result';
import { ServiceRequestService } from '@/lib/services';
import { toId } from '@/lib/utils';

import type { ServiceRequestDto } from '@/types';

/*
  A live-database walk of the booking lifecycle — the parts the unit test cannot reach because they cross
  the service and the database: the verified-center gate, per-actor authorization, and the guarded status
  machine end to end. Fixtures are namespaced by a run tag and removed in `finally`, so the script is safe
  to run against a shared database and safe to run twice.
*/
const BUSINESS = CODES.BUSINESS.BOOKINGS;

const service = new ServiceRequestService();

let checks = 0;

function pass(message: string): void {
  checks += 1;
  console.log(`  ok — ${message}`);
}

function expectSuccess(result: SingleResult<ServiceRequestDto>, context: string): ServiceRequestDto {
  if (!result.success || result.result === null) {
    throw new Error(`${context}: expected success but got ${result.errors[0]?.error ?? 'no result'}`);
  }
  return result.result;
}

function expectFailure(result: SingleResult<ServiceRequestDto>, code: number, message: string): void {
  if (result.success) {
    throw new Error(`${message}: expected a failure but the call succeeded`);
  }
  if (result.errors[0]?.code !== code) {
    throw new Error(`${message}: expected code ${code} but got ${result.errors[0]?.code ?? 'none'}`);
  }
  pass(message);
}

async function run(): Promise<void> {
  await connectToDatabase();
  console.log(`Connected to "${mongoose.connection.name}". Verifying bookings…`);

  const tag = `verify-bookings-${Date.now()}`;
  const account = (suffix: string) => ({
    name: `${tag} ${suffix}`,
    email: `${tag}-${suffix}@example.test`,
    password: 'password123',
    isApproved: true,
    isActive: true,
    emailVerified: true,
  });

  const owner = await User.create({ ...account('owner'), role: USER_ROLES.OWNER });
  const centerUserA = await User.create({ ...account('center-a'), role: USER_ROLES.SERVICE_CENTER });
  const centerUserB = await User.create({ ...account('center-b'), role: USER_ROLES.SERVICE_CENTER });
  const centerUserC = await User.create({ ...account('center-c'), role: USER_ROLES.SERVICE_CENTER });

  const centerBase = { address: '1 Test Road', city: 'Dhaka', phone: '018000000' };
  const profileA = await ServiceCenterProfile.create({ user: centerUserA._id, centerName: `${tag} A`, ...centerBase, isVerified: true });
  const profileB = await ServiceCenterProfile.create({ user: centerUserB._id, centerName: `${tag} B`, ...centerBase, isVerified: true });
  const profileC = await ServiceCenterProfile.create({ user: centerUserC._id, centerName: `${tag} C`, ...centerBase, isVerified: false });

  const vehicle = await Vehicle.create({
    owner: owner._id,
    make: 'Toyota',
    model: 'Corolla',
    year: 2020,
    vin: `VB${Date.now()}`,
    registrationNo: `REG${Date.now()}`,
    fuelType: 'PETROL',
    transmission: 'MANUAL',
    currentMileage: 1000,
  });

  const ownerId = toId(owner._id);
  const vehicleId = toId(vehicle._id);
  const centerAId = toId(centerUserA._id);
  const centerBId = toId(centerUserB._id);

  const baseBooking = { vehicleId, serviceType: 'Oil change', priority: SERVICE_REQUEST_PRIORITIES.NORMAL, preferredDate: new Date() };

  try {
    // 1. A booking against an unverified center is refused.
    const refused = await service.create(ownerId, { ...baseBooking, serviceCenterId: toId(profileC._id) });
    expectFailure(refused, BUSINESS.CENTER_NOT_VERIFIED.CODE, 'a booking against an unverified center is refused');

    // 2. A booking against a verified center succeeds, then walks PENDING → ACCEPTED → IN_PROGRESS → COMPLETED.
    const created = expectSuccess(
      await service.create(ownerId, { ...baseBooking, serviceCenterId: toId(profileA._id) }),
      'create against verified center'
    );
    if (created.status !== SERVICE_REQUEST_STATUSES.PENDING) {
      throw new Error(`a new booking should be PENDING but was ${created.status}`);
    }
    pass('a booking against a verified center is created PENDING');

    const bookingId = created.serviceRequestId;
    const accepted = expectSuccess(
      await service.transition(centerAId, { action: 'accept', serviceRequestId: bookingId, scheduledDate: new Date(), estimatedCost: 500000 }),
      'accept'
    );
    if (accepted.status !== SERVICE_REQUEST_STATUSES.ACCEPTED || accepted.estimatedCost !== 500000 || accepted.scheduledDate === null) {
      throw new Error('accept must record the scheduled date and estimate and move to ACCEPTED');
    }
    pass('accept records the scheduled date and estimate and moves to ACCEPTED');

    if ((await Notification.countDocuments({ user: owner._id, type: 'booking' })) < 1) {
      throw new Error('a booking transition must notify the owner');
    }
    pass('a booking transition writes a notification to the owner');

    const started = expectSuccess(await service.transition(centerAId, { action: 'start', serviceRequestId: bookingId }), 'start');
    if (started.status !== SERVICE_REQUEST_STATUSES.IN_PROGRESS) {
      throw new Error('start must move to IN_PROGRESS');
    }
    pass('start moves an accepted booking to IN_PROGRESS');

    // 3. An owner cancel after work has started is refused.
    const lateCancel = await service.transition(ownerId, { action: 'cancel', serviceRequestId: bookingId });
    expectFailure(lateCancel, BUSINESS.ILLEGAL_TRANSITION.CODE, 'an owner cannot cancel once work is in progress');

    // 4. A center may not transition a booking assigned to a different center.
    const foreign = await service.transition(centerBId, {
      action: 'complete',
      serviceRequestId: bookingId,
      finalCost: 600000,
      mileageAtService: 5000,
    });
    expectFailure(foreign, BUSINESS.NOT_ASSIGNED_CENTER.CODE, "a center cannot transition another center's booking");

    const completed = expectSuccess(
      await service.transition(centerAId, { action: 'complete', serviceRequestId: bookingId, finalCost: 600000, mileageAtService: 5000 }),
      'complete'
    );
    if (completed.status !== SERVICE_REQUEST_STATUSES.COMPLETED || completed.finalCost !== 600000) {
      throw new Error('complete must record the final cost and move to COMPLETED');
    }
    pass('complete records the final cost and moves to COMPLETED');

    // Completion writes exactly one durable record tied to the booking, at the recorded mileage.
    const records = await MaintenanceRecord.find({ serviceRequest: bookingId }).lean();
    if (records.length !== 1 || records[0]?.mileageAtService !== 5000 || records[0]?.cost !== 600000) {
      throw new Error(`completion must write exactly one record at the recorded mileage — found ${records.length}`);
    }
    pass('completion writes exactly one maintenance record tied to the booking');

    // The vehicle's odometer advances to the higher recorded mileage.
    const refreshed = await Vehicle.findById(vehicle._id).lean();
    if (refreshed?.currentMileage !== 5000) {
      throw new Error(`completion must advance the vehicle mileage to 5000 but it was ${refreshed?.currentMileage}`);
    }
    pass('completion advances the vehicle odometer to the recorded mileage');

    // 5. A declined booking is terminal — every further transition is refused.
    const second = expectSuccess(await service.create(ownerId, { ...baseBooking, serviceCenterId: toId(profileA._id) }), 'create second booking');
    const declined = expectSuccess(await service.transition(centerAId, { action: 'decline', serviceRequestId: second.serviceRequestId }), 'decline');
    if (declined.status !== SERVICE_REQUEST_STATUSES.DECLINED) {
      throw new Error('decline must move to DECLINED');
    }
    pass('decline moves a pending booking to DECLINED');

    const reaccept = await service.transition(centerAId, {
      action: 'accept',
      serviceRequestId: second.serviceRequestId,
      scheduledDate: new Date(),
      estimatedCost: 500000,
    });
    expectFailure(reaccept, BUSINESS.ILLEGAL_TRANSITION.CODE, 'a declined booking cannot be accepted');

    const restart = await service.transition(centerAId, { action: 'start', serviceRequestId: second.serviceRequestId });
    expectFailure(restart, BUSINESS.ILLEGAL_TRANSITION.CODE, 'a declined booking cannot be started');

    console.log(`\nAll ${checks} checks passed.`);
  } finally {
    await Notification.deleteMany({ user: owner._id });
    await MaintenanceRecord.deleteMany({ vehicle: vehicle._id });
    await ServiceRequest.deleteMany({ owner: owner._id });
    await Vehicle.deleteMany({ _id: vehicle._id });
    await ServiceCenterProfile.deleteMany({ _id: { $in: [profileA._id, profileB._id, profileC._id] } });
    await User.deleteMany({ _id: { $in: [owner._id, centerUserA._id, centerUserB._id, centerUserC._id] } });
    await mongoose.disconnect();
  }
}

run().catch(async error => {
  console.error('Booking verification failed:', error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
