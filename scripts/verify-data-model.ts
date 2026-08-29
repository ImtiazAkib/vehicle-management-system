import mongoose from 'mongoose';

import { Product } from '@/models/product.model';
import { SupplierProfile } from '@/models/supplier-profile.model';
import { User } from '@/models/user.model';
import { Vehicle } from '@/models/vehicle.model';

import { PRODUCT_CATEGORIES } from '@/constants/enums.const';
import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';

/*
  The guarantees that are indexes, not queries — unique VIN, unique SKU, one profile per account. Each is
  proven by writing a second row that must be refused with a duplicate-key error (E11000). Fixtures are
  removed in `finally`.
*/
let checks = 0;

function pass(message: string): void {
  checks += 1;
  console.log(`  ok — ${message}`);
}

function isDuplicateKey(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 11000);
}

async function expectDuplicate(message: string, write: () => Promise<unknown>): Promise<void> {
  try {
    await write();
  } catch (error) {
    if (isDuplicateKey(error)) {
      pass(message);
      return;
    }
    throw error;
  }
  throw new Error(`${message}: expected a duplicate-key error but the write succeeded`);
}

async function run(): Promise<void> {
  await connectToDatabase();
  console.log(`Connected to "${mongoose.connection.name}". Verifying the data model…`);

  const tag = `verify-data-model-${Date.now()}`;
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
  const supplierUser = await User.create({
    name: `${tag} supplier`,
    email: `${tag}-supplier@example.test`,
    password: 'password123',
    role: USER_ROLES.SUPPLIER,
    isApproved: true,
    isActive: true,
    emailVerified: true,
  });

  const supplierProfile = await SupplierProfile.create({
    user: supplierUser._id,
    businessName: `${tag} S`,
    address: '1 Road',
    city: 'Dhaka',
    phone: '018',
    isVerified: true,
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
  const product = await Product.create({
    supplier: supplierProfile._id,
    name: `${tag} part`,
    category: PRODUCT_CATEGORIES.TIRE,
    sku: `${tag}-SKU`,
    price: 10000,
    stockQuantity: 5,
    isActive: true,
  });

  try {
    await expectDuplicate('a second profile for the same account is refused', () =>
      SupplierProfile.create({ user: supplierUser._id, businessName: `${tag} S2`, address: '2 Road', city: 'Dhaka', phone: '019', isVerified: false })
    );

    await expectDuplicate('a second vehicle with the same VIN is refused', () =>
      Vehicle.create({
        owner: owner._id,
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        vin: `VIN-${stamp}`,
        registrationNo: `REG2-${stamp}`,
        fuelType: 'PETROL',
        transmission: 'AUTOMATIC',
        currentMileage: 500,
      })
    );

    await expectDuplicate('a second product with the same SKU is refused', () =>
      Product.create({
        supplier: supplierProfile._id,
        name: `${tag} part 2`,
        category: PRODUCT_CATEGORIES.OIL,
        sku: `${tag}-SKU`,
        price: 2000,
        stockQuantity: 1,
        isActive: true,
      })
    );

    console.log(`\nAll ${checks} checks passed.`);
  } finally {
    await Product.deleteMany({ supplier: supplierProfile._id });
    await Vehicle.deleteMany({ owner: owner._id });
    await SupplierProfile.deleteMany({ _id: supplierProfile._id });
    await User.deleteMany({ _id: { $in: [owner._id, supplierUser._id] } });
    void vehicle;
    void product;
    await mongoose.disconnect();
  }
}

run().catch(async error => {
  console.error('Data-model verification failed:', error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
