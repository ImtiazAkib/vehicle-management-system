import mongoose from 'mongoose';

import { MaintenanceSchedule } from '@/models/maintenance-schedule.model';
import { Notification } from '@/models/notification.model';
import { User } from '@/models/user.model';
import { Vehicle } from '@/models/vehicle.model';

import { MAINTENANCE_SCHEDULE_STATUSES } from '@/constants/enums.const';
import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';
import { MaintenanceService } from '@/lib/services';
import { toId } from '@/lib/utils';

const maintenance = new MaintenanceService();

let checks = 0;

function pass(message: string): void {
  checks += 1;
  console.log(`  ok — ${message}`);
}

async function run(): Promise<void> {
  await connectToDatabase();
  console.log(`Connected to "${mongoose.connection.name}". Verifying scheduling…`);

  const tag = `verify-scheduling-${Date.now()}`;
  // VIN and registrationNo cap at 32 characters, so key them off a compact stamp rather than the tag.
  const stamp = Date.now().toString(36);
  const owner = await User.create({
    name: `${tag} owner`,
    email: `${tag}-owner@example.test`,
    password: 'password123',
    role: USER_ROLES.OWNER,
    isApproved: true,
    isActive: true,
    emailVerified: true,
  });
  const vehicle = await Vehicle.create({
    owner: owner._id,
    make: 'Toyota',
    model: 'Corolla',
    year: 2020,
    vin: `VIN-${stamp}`,
    registrationNo: `REG-${stamp}`,
    fuelType: 'PETROL',
    transmission: 'MANUAL',
    currentMileage: 1000,
  });

  const ownerId = toId(owner._id);

  try {
    const created = await maintenance.create(ownerId, {
      vehicleId: toId(vehicle._id),
      serviceType: 'Oil change',
      nextDueDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });
    if (!created.success || created.result === null || created.result.status !== MAINTENANCE_SCHEDULE_STATUSES.OVERDUE) {
      throw new Error('a schedule past its due date is OVERDUE');
    }
    pass('a schedule past its due date is created OVERDUE');

    await maintenance.runReminderSweep();
    if ((await Notification.countDocuments({ user: owner._id, type: 'maintenance-reminder' })) !== 1) {
      throw new Error('the sweep notifies an overdue schedule once');
    }
    pass('the reminder sweep notifies the owner of an overdue schedule');

    // A second sweep within the renotify window must not notify again — lastNotifiedAt is the truth.
    await maintenance.runReminderSweep();
    if ((await Notification.countDocuments({ user: owner._id, type: 'maintenance-reminder' })) !== 1) {
      throw new Error('a second sweep must not re-notify the same schedule');
    }
    pass('a second sweep does not re-notify (lastNotifiedAt dedupes)');

    console.log(`\nAll ${checks} checks passed.`);
  } finally {
    await Notification.deleteMany({ user: owner._id });
    await MaintenanceSchedule.deleteMany({ vehicle: vehicle._id });
    await Vehicle.deleteMany({ _id: vehicle._id });
    await User.deleteMany({ _id: owner._id });
    await mongoose.disconnect();
  }
}

run().catch(async error => {
  console.error('Scheduling verification failed:', error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
