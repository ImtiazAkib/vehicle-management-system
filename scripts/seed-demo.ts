import mongoose, { Types } from 'mongoose';

import { Product } from '@/models/product.model';
import { ServiceCenterProfile } from '@/models/service-center-profile.model';
import { SupplierProfile } from '@/models/supplier-profile.model';
import { User } from '@/models/user.model';
import { Vehicle } from '@/models/vehicle.model';

import { FUEL_TYPES, PRODUCT_CATEGORIES, TRANSMISSIONS } from '@/constants/enums.const';
import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';

/*
  A small, believable slice of the platform to explore in a browser — one of each business role, a vehicle
  to service, a verified service center and supplier, and two parts on the shelf. It is NOT test data: the
  verify:* scripts create and delete their own tagged fixtures; this seed is meant to persist so there is
  something to look at after `npm run seed:demo`.

  Idempotent by design. Every account is keyed by a fixed `@demo.vusms` address and every profile/vehicle/
  product by a stable natural key (VIN, SKU, owning user), so a second run finds what the first made and
  changes nothing. The shared password is printed once; it is a demo, not a secret, and it is hashed by the
  model's pre-save hook like any other.
*/
const DEMO_PASSWORD = 'demo-password';

const DEMO_ACCOUNTS = [
  { key: 'owner', name: 'Demo Owner', email: 'owner@demo.vusms', role: USER_ROLES.OWNER },
  { key: 'service-center', name: 'Demo Service Center', email: 'service@demo.vusms', role: USER_ROLES.SERVICE_CENTER },
  { key: 'supplier', name: 'Demo Supplier', email: 'supplier@demo.vusms', role: USER_ROLES.SUPPLIER },
] as const;

async function ensureUser(account: (typeof DEMO_ACCOUNTS)[number]): Promise<Types.ObjectId> {
  const existing = await User.findOne({ email: account.email }).select('_id').lean<{ _id: Types.ObjectId } | null>();

  if (existing) {
    console.log(`  · ${account.email} already exists`);
    return existing._id;
  }

  const created = await User.create({
    name: account.name,
    email: account.email,
    // Hashed by the model's pre-save hook, never here.
    password: DEMO_PASSWORD,
    role: account.role,
    isApproved: true,
    isActive: true,
    // Service centers and suppliers transact only once verified; these are pre-verified so the demo works.
    emailVerified: true,
  });
  console.log(`  + created ${account.email} (${account.role})`);

  return created._id as Types.ObjectId;
}

async function run(): Promise<void> {
  await connectToDatabase();
  console.log(`Connected to "${mongoose.connection.name}". Seeding demo data…`);

  console.log('Accounts:');
  const ownerId = await ensureUser(DEMO_ACCOUNTS[0]);
  const serviceUserId = await ensureUser(DEMO_ACCOUNTS[1]);
  const supplierUserId = await ensureUser(DEMO_ACCOUNTS[2]);

  const serviceCenter = await ServiceCenterProfile.findOneAndUpdate(
    { user: serviceUserId },
    {
      $setOnInsert: {
        user: serviceUserId,
        centerName: 'Demo Auto Care',
        address: '12 Demo Avenue',
        city: 'Dhaka',
        phone: '01700000001',
        servicesOffered: ['Oil change', 'Brake service', 'Tire rotation'],
        isVerified: true,
      },
    },
    { upsert: true, returnDocument: 'after' }
  );
  console.log(`Service center profile: ${serviceCenter.centerName}`);

  const supplier = await SupplierProfile.findOneAndUpdate(
    { user: supplierUserId },
    {
      $setOnInsert: {
        user: supplierUserId,
        businessName: 'Demo Parts Co.',
        address: '5 Demo Street',
        city: 'Dhaka',
        phone: '01700000002',
        isVerified: true,
      },
    },
    { upsert: true, returnDocument: 'after' }
  );
  console.log(`Supplier profile: ${supplier.businessName}`);

  const vehicle = await Vehicle.findOneAndUpdate(
    { vin: 'DEMOVIN0000000001' },
    {
      $setOnInsert: {
        owner: ownerId,
        make: 'Toyota',
        model: 'Corolla',
        year: 2021,
        vin: 'DEMOVIN0000000001',
        registrationNo: 'DHAKA-DEMO-01',
        color: 'Silver',
        fuelType: FUEL_TYPES.PETROL,
        transmission: TRANSMISSIONS.AUTOMATIC,
        currentMileage: 42000,
      },
    },
    { upsert: true, returnDocument: 'after' }
  );
  console.log(`Vehicle: ${vehicle.make} ${vehicle.model} (${vehicle.registrationNo})`);

  const products = [
    { sku: 'DEMO-OIL-5W30', name: '5W-30 Synthetic Oil (4L)', category: PRODUCT_CATEGORIES.OIL, price: 350000, stockQuantity: 40 },
    { sku: 'DEMO-TIRE-R15', name: 'All-Season Tire R15', category: PRODUCT_CATEGORIES.TIRE, price: 850000, stockQuantity: 24 },
  ] as const;

  for (const item of products) {
    const product = await Product.findOneAndUpdate(
      { sku: item.sku },
      {
        $setOnInsert: {
          supplier: supplier._id,
          name: item.name,
          category: item.category,
          sku: item.sku,
          price: item.price,
          stockQuantity: item.stockQuantity,
          isActive: true,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.log(`Product: ${product.name} (${product.sku})`);
  }

  console.log(`\nDemo ready. Sign in with any of ${DEMO_ACCOUNTS.map(a => a.email).join(', ')} — password "${DEMO_PASSWORD}".`);
  await mongoose.disconnect();
}

run().catch(async error => {
  console.error('Demo seeding failed:', error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
