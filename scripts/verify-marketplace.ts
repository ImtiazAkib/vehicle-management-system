import mongoose from 'mongoose';

import { Product } from '@/models/product.model';
import { SupplierProfile } from '@/models/supplier-profile.model';
import { User } from '@/models/user.model';

import { CODES } from '@/constants/codes.const';
import { PRODUCT_CATEGORIES } from '@/constants/enums.const';
import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';
import type { ListResult, SingleResult } from '@/lib/result';
import { ProductService, SupplierService } from '@/lib/services';
import { toId } from '@/lib/utils';

import type { ProductDto } from '@/types';

/*
  A live-database walk of the marketplace: SKU uniqueness, the verified-seller browse gate, and the
  category/free-text/price filters. Fixtures are namespaced by a run tag (used as the browse query, so the
  assertions see only this run's products) and removed in `finally`.
*/
const BUSINESS = CODES.BUSINESS.MARKETPLACE;
const VALIDATION = CODES.VALIDATION.MARKETPLACE;

const products = new ProductService();
const suppliers = new SupplierService();

let checks = 0;

function pass(message: string): void {
  checks += 1;
  console.log(`  ok — ${message}`);
}

function expectProduct(result: SingleResult<ProductDto>, context: string): ProductDto {
  if (!result.success || result.result === null) {
    throw new Error(`${context}: expected success but got ${result.errors[0]?.error ?? 'no result'}`);
  }
  return result.result;
}

function expectFailure(result: SingleResult<ProductDto>, code: number, message: string): void {
  if (result.success) {
    throw new Error(`${message}: expected a failure but the call succeeded`);
  }
  if (result.errors[0]?.code !== code) {
    throw new Error(`${message}: expected code ${code} but got ${result.errors[0]?.code ?? 'none'}`);
  }
  pass(message);
}

function ids(result: ListResult<ProductDto>): string[] {
  return (result.result ?? []).map(product => product.productId).sort();
}

async function run(): Promise<void> {
  await connectToDatabase();
  console.log(`Connected to "${mongoose.connection.name}". Verifying marketplace…`);

  const tag = `verify-marketplace-${Date.now()}`;
  const account = (suffix: string) => ({
    name: `${tag} ${suffix}`,
    email: `${tag}-${suffix}@example.test`,
    password: 'password123',
    role: USER_ROLES.SUPPLIER,
    isApproved: true,
    isActive: true,
    emailVerified: true,
  });

  const supplierUserA = await User.create(account('a'));
  const supplierUserB = await User.create(account('b'));

  const base = { address: '1 Test Road', city: 'Dhaka', phone: '018000000' };
  const profileA = await SupplierProfile.create({ user: supplierUserA._id, businessName: `${tag} A`, ...base, isVerified: true });
  const profileB = await SupplierProfile.create({ user: supplierUserB._id, businessName: `${tag} B`, ...base, isVerified: false });

  const aId = toId(supplierUserA._id);
  const bId = toId(supplierUserB._id);

  try {
    // 1. Create binds the product to the caller's own profile.
    const p1 = expectProduct(
      await products.create(aId, {
        name: `${tag} oil filter`,
        category: PRODUCT_CATEGORIES.FILTER,
        sku: `${tag}-SKU1`,
        price: 50000,
        stockQuantity: 10,
      }),
      'create'
    );
    if (p1.supplierId !== toId(profileA._id)) {
      throw new Error('a created product must bind to the caller SupplierProfile');
    }
    pass('a created product binds to the seller from the session');

    // 2. A duplicate SKU is refused with a marketplace code, and no second row is written.
    const dup = await products.create(bId, {
      name: `${tag} rival`,
      category: PRODUCT_CATEGORIES.OTHER,
      sku: `${tag}-SKU1`,
      price: 10000,
      stockQuantity: 1,
    });
    expectFailure(dup, BUSINESS.DUPLICATE_SKU.CODE, 'a duplicate SKU is refused with a marketplace code');
    if ((await Product.countDocuments({ sku: `${tag}-SKU1` })) !== 1) {
      throw new Error('a refused duplicate must not write a row');
    }
    pass('the refused duplicate wrote no row');

    // A second verified product, and two that browse must hide: an unverified seller's, and an inactive one.
    const p2 = expectProduct(
      await products.create(aId, {
        name: `${tag} coolant`,
        category: PRODUCT_CATEGORIES.COOLANT,
        sku: `${tag}-SKU2`,
        price: 200000,
        stockQuantity: 5,
      }),
      'create p2'
    );
    await products.create(bId, { name: `${tag} wiper`, category: PRODUCT_CATEGORIES.WIPER, sku: `${tag}-SKU3`, price: 30000, stockQuantity: 5 });
    const inactive = expectProduct(
      await products.create(aId, {
        name: `${tag} battery`,
        category: PRODUCT_CATEGORIES.BATTERY,
        sku: `${tag}-SKU4`,
        price: 900000,
        stockQuantity: 2,
      }),
      'create inactive'
    );
    await products.setActive(aId, inactive.productId, false);

    // 3. Browse shows only the verified seller's active products.
    const visible = await products.browse({ q: tag, page: 1 });
    if (JSON.stringify(ids(visible)) !== JSON.stringify([p1.productId, p2.productId].sort())) {
      throw new Error(`browse must show only verified, active products — got ${ids(visible).length}`);
    }
    pass("browse hides an unverified seller's products and inactive listings");

    // 4. The category filter narrows to exactly the matching listings.
    const filtered = await products.browse({ q: tag, category: PRODUCT_CATEGORIES.FILTER, page: 1 });
    if (JSON.stringify(ids(filtered)) !== JSON.stringify([p1.productId])) {
      throw new Error('the category filter must narrow to the matching listing');
    }
    pass('the category filter narrows the result set');

    // 5. The price range filters on the stored minor-unit price.
    const dear = await products.browse({ q: tag, minPrice: 100000, page: 1 });
    const cheap = await products.browse({ q: tag, maxPrice: 100000, page: 1 });
    if (JSON.stringify(ids(dear)) !== JSON.stringify([p2.productId]) || JSON.stringify(ids(cheap)) !== JSON.stringify([p1.productId])) {
      throw new Error('the min/max price filters must narrow to the products in range');
    }
    pass('the min/max price range narrows the result set');

    // 6. Public detail resolves only for a verified seller's active product.
    expectProduct(await products.getPublicProduct(p1.productId), 'public detail (verified active)');
    pass('public detail resolves a verified seller active product');

    expectFailure(await products.getPublicProduct(inactive.productId), VALIDATION.PRODUCT_NOT_FOUND.CODE, 'public detail hides an inactive product');

    // The public directory lists the verified supplier and not the unverified one.
    const directory = (await suppliers.listVerified()).result ?? [];
    const directoryIds = directory.map(supplier => supplier.supplierId);
    if (!directoryIds.includes(toId(profileA._id)) || directoryIds.includes(toId(profileB._id))) {
      throw new Error('the public directory must list verified suppliers only');
    }
    pass('the public directory lists verified suppliers only');

    console.log(`\nAll ${checks} checks passed.`);
  } finally {
    await Product.deleteMany({ supplier: { $in: [profileA._id, profileB._id] } });
    await SupplierProfile.deleteMany({ _id: { $in: [profileA._id, profileB._id] } });
    await User.deleteMany({ _id: { $in: [supplierUserA._id, supplierUserB._id] } });
    await mongoose.disconnect();
  }
}

run().catch(async error => {
  console.error('Marketplace verification failed:', error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
