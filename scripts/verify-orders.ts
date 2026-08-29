import mongoose from 'mongoose';

import { OrderItem } from '@/models/order-item.model';
import { Order } from '@/models/order.model';
import { Product } from '@/models/product.model';
import { SupplierProfile } from '@/models/supplier-profile.model';
import { User } from '@/models/user.model';

import { CODES } from '@/constants/codes.const';
import { ORDER_STATUSES, PRODUCT_CATEGORIES } from '@/constants/enums.const';
import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';
import type { SingleResult } from '@/lib/result';
import { ORDER_SHIPPING_FEE, OrderService } from '@/lib/services';
import { toId } from '@/lib/utils';

/*
  A live-database walk of the order lifecycle: the atomic stock reservation, the price snapshot and totals,
  the guarded fulfillment transitions, and the restock-on-cancel. Fixtures are removed in `finally`.
*/
const BUSINESS = CODES.BUSINESS.ORDERS;
const orders = new OrderService();

let checks = 0;

function pass(message: string): void {
  checks += 1;
  console.log(`  ok — ${message}`);
}

function expectSuccess<T>(result: SingleResult<T>, context: string): T {
  if (!result.success || result.result === null) {
    throw new Error(`${context}: expected success but got ${result.errors[0]?.error ?? 'no result'}`);
  }
  return result.result;
}

function expectFailure<T>(result: SingleResult<T>, code: number, message: string): void {
  if (result.success) {
    throw new Error(`${message}: expected a failure but the call succeeded`);
  }
  if (result.errors[0]?.code !== code) {
    throw new Error(`${message}: expected code ${code} but got ${result.errors[0]?.code ?? 'none'}`);
  }
  pass(message);
}

async function stockOf(productId: string): Promise<number> {
  const product = await Product.findById(productId).select('stockQuantity').lean<{ stockQuantity: number } | null>();
  return product?.stockQuantity ?? -1;
}

async function run(): Promise<void> {
  await connectToDatabase();
  console.log(`Connected to "${mongoose.connection.name}". Verifying orders…`);

  const tag = `verify-orders-${Date.now()}`;
  const account = (suffix: string, role: (typeof USER_ROLES)[keyof typeof USER_ROLES]) => ({
    name: `${tag} ${suffix}`,
    email: `${tag}-${suffix}@example.test`,
    password: 'password123',
    role,
    isApproved: true,
    isActive: true,
    emailVerified: true,
  });

  const buyer = await User.create(account('buyer', USER_ROLES.OWNER));
  const supplierUserA = await User.create(account('supplier-a', USER_ROLES.SUPPLIER));
  const supplierUserB = await User.create(account('supplier-b', USER_ROLES.SUPPLIER));

  const base = { address: '1 Test Road', city: 'Dhaka', phone: '018000000' };
  const profileA = await SupplierProfile.create({ user: supplierUserA._id, businessName: `${tag} A`, ...base, isVerified: true });
  const profileB = await SupplierProfile.create({ user: supplierUserB._id, businessName: `${tag} B`, ...base, isVerified: true });

  const product = await Product.create({
    supplier: profileA._id,
    name: `${tag} tire`,
    category: PRODUCT_CATEGORIES.TIRE,
    sku: `${tag}-SKU`,
    price: 10000,
    stockQuantity: 5,
    isActive: true,
  });

  const buyerId = toId(buyer._id);
  const aId = toId(supplierUserA._id);
  const bId = toId(supplierUserB._id);
  const productId = toId(product._id);
  const supplierId = toId(profileA._id);
  const shippingAddress = { line1: '1 Buyer Lane', city: 'Dhaka' };

  try {
    // 1. Placing an order reserves stock and reconciles its totals.
    const first = expectSuccess(
      await orders.create(buyerId, { supplier: supplierId, items: [{ product: productId, quantity: 2 }], shippingAddress }),
      'place'
    );
    const { order } = first;
    if (
      order.subtotal !== 20000 ||
      order.shippingFee !== ORDER_SHIPPING_FEE ||
      order.subtotal + order.shippingFee + order.tax !== order.totalAmount
    ) {
      throw new Error('order totals must reconcile to the minor unit');
    }
    if ((await stockOf(productId)) !== 3) {
      throw new Error('placing an order must decrement stock');
    }
    pass('placing an order reserves stock and reconciles its totals');

    // 2. Over-ordering is refused, names the product, and decrements nothing.
    const over = await orders.create(buyerId, { supplier: supplierId, items: [{ product: productId, quantity: 10 }], shippingAddress });
    expectFailure(over, BUSINESS.INSUFFICIENT_STOCK.CODE, 'an order beyond stock is refused');
    if (over.errors[0]?.field !== productId) {
      throw new Error('the stock refusal must name the offending product');
    }
    if ((await stockOf(productId)) !== 3) {
      throw new Error('a refused order must leave stock untouched');
    }
    pass('the refused over-order named the product and touched no stock');

    // 3. Cancelling before ship restocks exactly what it reserved.
    const cancelled = expectSuccess(await orders.cancel(buyerId, order.orderId), 'cancel');
    if (cancelled.status !== ORDER_STATUSES.CANCELLED || (await stockOf(productId)) !== 5) {
      throw new Error('cancelling before ship must restock the reserved units');
    }
    pass('cancelling before ship restocks the reserved units');

    // 4. A full lifecycle walk: confirm → pack → ship → deliver.
    const second = expectSuccess(
      await orders.create(buyerId, { supplier: supplierId, items: [{ product: productId, quantity: 1 }], shippingAddress }),
      'place second'
    );
    const orderId = second.order.orderId;
    const steps: [Parameters<OrderService['advance']>[2], string][] = [
      ['confirm', ORDER_STATUSES.CONFIRMED],
      ['pack', ORDER_STATUSES.PACKED],
      ['ship', ORDER_STATUSES.SHIPPED],
      ['deliver', ORDER_STATUSES.DELIVERED],
    ];
    for (const [action, expected] of steps) {
      const advanced = expectSuccess(await orders.advance(aId, orderId, action), `advance ${action}`);
      if (advanced.status !== expected) {
        throw new Error(`advance ${action} must move to ${expected}`);
      }
    }
    pass('a placed order walks confirm → pack → ship → deliver');

    // 5. Cancel after ship is refused.
    expectFailure(await orders.cancel(buyerId, orderId), BUSINESS.ILLEGAL_TRANSITION.CODE, 'a cancel after the goods ship is refused');

    // 6. A third order guards the actor and the illegal jump.
    const third = expectSuccess(
      await orders.create(buyerId, { supplier: supplierId, items: [{ product: productId, quantity: 1 }], shippingAddress }),
      'place third'
    );
    expectFailure(
      await orders.advance(bId, third.order.orderId, 'confirm'),
      BUSINESS.NOT_SELLER.CODE,
      'a supplier other than the assigned one cannot advance the order'
    );
    expectFailure(await orders.advance(aId, third.order.orderId, 'ship'), BUSINESS.ILLEGAL_TRANSITION.CODE, 'a jump that skips a stage is refused');

    console.log(`\nAll ${checks} checks passed.`);
  } finally {
    const orderIds = await Order.find({ buyer: buyer._id }).distinct('_id');
    await OrderItem.deleteMany({ order: { $in: orderIds } });
    await Order.deleteMany({ buyer: buyer._id });
    await Product.deleteMany({ supplier: { $in: [profileA._id, profileB._id] } });
    await SupplierProfile.deleteMany({ _id: { $in: [profileA._id, profileB._id] } });
    await User.deleteMany({ _id: { $in: [buyer._id, supplierUserA._id, supplierUserB._id] } });
    await mongoose.disconnect();
  }
}

run().catch(async error => {
  console.error('Order verification failed:', error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
