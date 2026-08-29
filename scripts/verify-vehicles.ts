import mongoose from 'mongoose';

import { User } from '@/models/user.model';
import { Vehicle } from '@/models/vehicle.model';

import { CODES } from '@/constants/codes.const';
import { FUEL_TYPES, TRANSMISSIONS } from '@/constants/enums.const';
import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';
import { VehicleService } from '@/lib/services';
import { toId } from '@/lib/utils';

const BUSINESS = CODES.BUSINESS.VEHICLES;
const VALIDATION = CODES.VALIDATION.VEHICLES;

const vehicles = new VehicleService();

let checks = 0;

function pass(message: string): void {
  checks += 1;
  console.log(`  ok — ${message}`);
}

async function run(): Promise<void> {
  await connectToDatabase();
  console.log(`Connected to "${mongoose.connection.name}". Verifying vehicles…`);

  const tag = `verify-vehicles-${Date.now()}`;
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
  const otherOwner = await User.create({
    name: `${tag} owner2`,
    email: `${tag}-owner2@example.test`,
    password: 'password123',
    role: USER_ROLES.OWNER,
    isApproved: true,
    isActive: true,
    emailVerified: true,
  });

  const ownerId = toId(owner._id);
  const otherId = toId(otherOwner._id);
  const input = {
    make: 'Toyota',
    model: 'Corolla',
    year: 2020,
    vin: `VIN-${stamp}`,
    registrationNo: `REG-${stamp}`,
    fuelType: FUEL_TYPES.PETROL,
    transmission: TRANSMISSIONS.MANUAL,
    currentMileage: 1000,
  };

  try {
    const created = await vehicles.create(ownerId, input);
    if (!created.success || created.result === null) {
      throw new Error('creating a vehicle should succeed');
    }
    pass('an owner registers a vehicle');

    const listed = (await vehicles.list(ownerId)).result ?? [];
    if (listed.length !== 1 || listed[0]?.vehicleId !== created.result.vehicleId) {
      throw new Error('the list is scoped to the owner');
    }
    pass('the vehicle list is scoped to the owner');

    const dupVin = await vehicles.create(ownerId, { ...input, registrationNo: `REG2-${stamp}` });
    if (dupVin.success || dupVin.errors[0]?.code !== BUSINESS.DUPLICATE_VIN.CODE) {
      throw new Error('a duplicate VIN must be refused');
    }
    pass('a duplicate VIN is refused with a field-level code');

    const dupReg = await vehicles.create(ownerId, { ...input, vin: `VIN2-${stamp}` });
    if (dupReg.success || dupReg.errors[0]?.code !== BUSINESS.DUPLICATE_REGISTRATION.CODE) {
      throw new Error('a duplicate registration must be refused');
    }
    pass('a duplicate registration number is refused');

    const foreignRemove = await vehicles.remove(otherId, created.result.vehicleId);
    if (foreignRemove.success || foreignRemove.errors[0]?.code !== VALIDATION.NOT_FOUND.CODE) {
      throw new Error("one owner must not delete another's vehicle");
    }
    pass("an owner cannot remove another owner's vehicle");

    const removed = await vehicles.remove(ownerId, created.result.vehicleId);
    if (!removed.success || (await vehicles.list(ownerId)).result?.length !== 0) {
      throw new Error('the owner removes their own vehicle');
    }
    pass('the owner removes their own vehicle');

    console.log(`\nAll ${checks} checks passed.`);
  } finally {
    await Vehicle.deleteMany({ owner: { $in: [owner._id, otherOwner._id] } });
    await User.deleteMany({ _id: { $in: [owner._id, otherOwner._id] } });
    await mongoose.disconnect();
  }
}

run().catch(async error => {
  console.error('Vehicle verification failed:', error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
