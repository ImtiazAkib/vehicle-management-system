import mongoose from 'mongoose';

import { Invoice } from '@/models/invoice.model';
import { MaintenanceRecord } from '@/models/maintenance-record.model';
import { MaintenanceSchedule } from '@/models/maintenance-schedule.model';
import { Notification } from '@/models/notification.model';
import { OrderItem } from '@/models/order-item.model';
import { Order } from '@/models/order.model';
import { Payment } from '@/models/payment.model';
import { Product } from '@/models/product.model';
import { Review } from '@/models/review.model';
import { ServiceCenterProfile } from '@/models/service-center-profile.model';
import { ServiceRequest } from '@/models/service-request.model';
import { SupplierProfile } from '@/models/supplier-profile.model';
import { User } from '@/models/user.model';
import { Vehicle } from '@/models/vehicle.model';

import {
  FUEL_TYPES,
  MAINTENANCE_SCHEDULE_STATUSES,
  PRODUCT_CATEGORIES,
  REVIEW_TARGET_TYPES,
  SERVICE_REQUEST_PRIORITIES,
  TRANSMISSIONS,
} from '@/constants/enums.const';
import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';
import { InvoiceService, OrderService, PaymentService, ReportService, ReviewService, ServiceRequestService } from '@/lib/services';
import { toId } from '@/lib/utils';

import type { MaintenanceScheduleStatus } from '@/types';

/*
  A live-database walk of the reports: seeded vehicles, schedules, bookings, orders, invoices, payments and
  reviews produce exact per-role figures, cross-tenant fixtures stay out of a caller's rollup, and every
  review write leaves the target's aggregate equal to a fresh mean. Fixtures are removed in `finally`.
*/
const requestService = new ServiceRequestService();
const orderService = new OrderService();
const invoiceService = new InvoiceService();
const paymentService = new PaymentService();
const reviewService = new ReviewService();
const reportService = new ReportService();

let checks = 0;

function assert(condition: boolean, message: string): void {
  checks += 1;
  if (!condition) {
    throw new Error(`FAILED: ${message}`);
  }
  console.log(`  ok — ${message}`);
}

async function run(): Promise<void> {
  await connectToDatabase();
  console.log(`Connected to "${mongoose.connection.name}". Verifying reports…`);

  const tag = `verify-reports-${Date.now()}`;
  const account = (suffix: string, role: (typeof USER_ROLES)[keyof typeof USER_ROLES]) => ({
    name: `${tag} ${suffix}`,
    email: `${tag}-${suffix}@example.test`,
    password: 'password123',
    role,
    isApproved: true,
    isActive: true,
    emailVerified: true,
  });

  const owner = await User.create(account('owner', USER_ROLES.OWNER));
  const otherOwner = await User.create(account('owner2', USER_ROLES.OWNER));
  const centerUser = await User.create(account('center', USER_ROLES.SERVICE_CENTER));
  const supplierUser = await User.create(account('supplier', USER_ROLES.SUPPLIER));

  const base = { address: '1 Test Road', city: 'Dhaka', phone: '018000000' };
  const centerProfile = await ServiceCenterProfile.create({ user: centerUser._id, centerName: `${tag} C`, ...base, isVerified: true });
  const supplierProfile = await SupplierProfile.create({ user: supplierUser._id, businessName: `${tag} S`, ...base, isVerified: true });

  const vehicleBase = {
    fuelType: FUEL_TYPES.PETROL,
    transmission: TRANSMISSIONS.MANUAL,
    currentMileage: 1000,
    make: 'Toyota',
    model: 'Corolla',
    year: 2020,
  };
  const vehicleA = await Vehicle.create({ owner: owner._id, ...vehicleBase, vin: `${tag}-VA`, registrationNo: `${tag}-RA` });
  const vehicleB = await Vehicle.create({ owner: owner._id, ...vehicleBase, vin: `${tag}-VB`, registrationNo: `${tag}-RB` });
  const otherVehicle = await Vehicle.create({ owner: otherOwner._id, ...vehicleBase, vin: `${tag}-VO`, registrationNo: `${tag}-RO` });

  const schedule = (vehicle: mongoose.Types.ObjectId, status: MaintenanceScheduleStatus) => ({
    vehicle,
    serviceType: 'Oil change',
    nextDueDate: new Date(),
    status,
  });
  await MaintenanceSchedule.create(schedule(vehicleA._id, MAINTENANCE_SCHEDULE_STATUSES.DUE));
  await MaintenanceSchedule.create(schedule(vehicleA._id, MAINTENANCE_SCHEDULE_STATUSES.UPCOMING));
  await MaintenanceSchedule.create(schedule(vehicleB._id, MAINTENANCE_SCHEDULE_STATUSES.OVERDUE));
  await MaintenanceSchedule.create(schedule(otherVehicle._id, MAINTENANCE_SCHEDULE_STATUSES.DUE));

  const product = await Product.create({
    supplier: supplierProfile._id,
    name: `${tag} part`,
    category: PRODUCT_CATEGORIES.TIRE,
    sku: `${tag}-SKU`,
    price: 20000,
    stockQuantity: 20,
    isActive: true,
  });

  const ownerId = toId(owner._id);
  const centerId = toId(centerUser._id);
  const supplierId = toId(supplierUser._id);
  const centerProfileId = toId(centerProfile._id);
  const supplierProfileId = toId(supplierProfile._id);

  try {
    // Two bookings at the center; complete one, and settle its SERVICE invoice.
    const booking1 = await requestService.create(ownerId, {
      vehicleId: toId(vehicleA._id),
      serviceCenterId: centerProfileId,
      serviceType: 'Brake service',
      priority: SERVICE_REQUEST_PRIORITIES.NORMAL,
      preferredDate: new Date(),
    });
    await requestService.create(ownerId, {
      vehicleId: toId(vehicleB._id),
      serviceCenterId: centerProfileId,
      serviceType: 'Tune up',
      priority: SERVICE_REQUEST_PRIORITIES.NORMAL,
      preferredDate: new Date(),
    });
    if (!booking1.success || booking1.result === null) {
      throw new Error('setup: booking create failed');
    }
    const bookingId = booking1.result.serviceRequestId;
    await requestService.transition(centerId, { action: 'accept', serviceRequestId: bookingId, scheduledDate: new Date(), estimatedCost: 100000 });
    await requestService.transition(centerId, { action: 'start', serviceRequestId: bookingId });
    await requestService.transition(centerId, { action: 'complete', serviceRequestId: bookingId, finalCost: 100000, mileageAtService: 2000 });
    const serviceInvoice = await invoiceService.issueServiceInvoice(centerId, { serviceRequestId: bookingId });
    if (!serviceInvoice.success || serviceInvoice.result === null) {
      throw new Error('setup: service invoice failed');
    }
    await paymentService.recordPayment(ownerId, { invoiceId: serviceInvoice.result.invoiceId, amount: 100000, method: 'CASH' });

    // Two orders from the supplier; deliver one (3 units) and settle its ORDER invoice.
    const shippingAddress = { line1: '1 Buyer Lane', city: 'Dhaka' };
    const order1 = await orderService.create(ownerId, {
      supplier: supplierProfileId,
      items: [{ product: toId(product._id), quantity: 3 }],
      shippingAddress,
    });
    await orderService.create(ownerId, { supplier: supplierProfileId, items: [{ product: toId(product._id), quantity: 1 }], shippingAddress });
    if (!order1.success || order1.result === null) {
      throw new Error('setup: order create failed');
    }
    const orderId = order1.result.order.orderId;
    for (const action of ['confirm', 'pack', 'ship', 'deliver'] as const) {
      await orderService.advance(supplierId, orderId, action);
    }
    const orderInvoice = await invoiceService.issueOrderInvoice(supplierId, { orderId });
    if (!orderInvoice.success || orderInvoice.result === null) {
      throw new Error('setup: order invoice failed');
    }
    await paymentService.recordPayment(ownerId, { invoiceId: orderInvoice.result.invoiceId, amount: orderInvoice.result.total, method: 'WALLET' });
    const deliveredTotal = order1.result.order.totalAmount; // 3*20000 + 5000 shipping

    // 1. Owner maintenance summary — scoped to this owner only.
    const ownerReport = (await reportService.ownerMaintenanceSummary(ownerId)).result;
    assert(
      ownerReport?.vehicleCount === 2 && ownerReport.scheduleCount === 3 && ownerReport.dueSoonCount === 2,
      "the owner summary counts only the owner's vehicles and schedules"
    );
    assert(ownerReport?.totalSpend === 100000 + orderInvoice.result.total, 'the owner summary sums the settled invoice totals');

    // 2. Center performance — scoped to this center.
    const centerReport = (await reportService.serviceCenterPerformance(centerId)).result;
    assert(
      centerReport?.requestCount === 2 && centerReport.completedCount === 1 && centerReport.completionRate === 0.5,
      'the center report counts its own requests and completion rate'
    );
    assert(centerReport?.revenue === 100000, 'the center revenue is its settled SERVICE invoices');

    // 3. Supplier sales — scoped to this supplier.
    const supplierReport = (await reportService.supplierSales(supplierId)).result;
    assert(
      supplierReport?.orderCount === 2 && supplierReport.deliveredCount === 1 && supplierReport.fulfillmentRate === 0.5,
      'the supplier report counts its own orders and fulfillment rate'
    );
    assert(supplierReport?.unitsSold === 3 && supplierReport.revenue === deliveredTotal, 'the supplier units and revenue come from delivered orders');
    assert(supplierReport?.topProducts.length === 1 && supplierReport.topProducts[0]?.units === 3, 'the top-products list ranks the delivered units');

    // 4. Reviews leave each target's aggregate equal to a fresh mean.
    await reviewService.create(ownerId, { targetType: REVIEW_TARGET_TYPES.SERVICE_CENTER, targetId: centerProfileId, rating: 5 });
    await reviewService.create(ownerId, { targetType: REVIEW_TARGET_TYPES.SUPPLIER, targetId: supplierProfileId, rating: 4 });
    await reviewService.create(ownerId, { targetType: REVIEW_TARGET_TYPES.PRODUCT, targetId: toId(product._id), rating: 3 });

    const centerAfter = await ServiceCenterProfile.findById(centerProfile._id)
      .select('ratingAvg ratingCount')
      .lean<{ ratingAvg: number; ratingCount: number } | null>();
    const supplierAfter = await SupplierProfile.findById(supplierProfile._id)
      .select('ratingAvg ratingCount')
      .lean<{ ratingAvg: number; ratingCount: number } | null>();
    const productAfter = await Product.findById(product._id)
      .select('ratingAvg ratingCount')
      .lean<{ ratingAvg: number; ratingCount: number } | null>();
    assert(
      centerAfter?.ratingAvg === 5 && centerAfter.ratingCount === 1 && supplierAfter?.ratingAvg === 4 && productAfter?.ratingAvg === 3,
      'each review recomputes its target aggregate to the fresh mean'
    );

    // A resubmission updates in place rather than duplicating.
    await reviewService.create(ownerId, { targetType: REVIEW_TARGET_TYPES.SERVICE_CENTER, targetId: centerProfileId, rating: 3 });
    const centerReReviewed = await ServiceCenterProfile.findById(centerProfile._id)
      .select('ratingAvg ratingCount')
      .lean<{ ratingAvg: number; ratingCount: number } | null>();
    assert(centerReReviewed?.ratingAvg === 3 && centerReReviewed.ratingCount === 1, 'a resubmitted review updates the row, not a duplicate');

    // 5. A non-owner cannot review.
    const centerReview = await reviewService.create(centerId, { targetType: REVIEW_TARGET_TYPES.SUPPLIER, targetId: supplierProfileId, rating: 5 });
    assert(!centerReview.success, 'a non-owner is refused a review');

    console.log(`\nAll ${checks} checks passed.`);
  } finally {
    const invoiceIds = await Invoice.find({ owner: owner._id }).distinct('_id');
    await Payment.deleteMany({ invoice: { $in: invoiceIds } });
    await Invoice.deleteMany({ owner: owner._id });
    const orderIds = await Order.find({ buyer: owner._id }).distinct('_id');
    await OrderItem.deleteMany({ order: { $in: orderIds } });
    await Order.deleteMany({ buyer: owner._id });
    await Review.deleteMany({ author: { $in: [owner._id, centerUser._id] } });
    await Notification.deleteMany({ user: { $in: [owner._id, centerUser._id, supplierUser._id] } });
    await MaintenanceRecord.deleteMany({ vehicle: { $in: [vehicleA._id, vehicleB._id] } });
    await MaintenanceSchedule.deleteMany({ vehicle: { $in: [vehicleA._id, vehicleB._id, otherVehicle._id] } });
    await ServiceRequest.deleteMany({ owner: owner._id });
    await Vehicle.deleteMany({ _id: { $in: [vehicleA._id, vehicleB._id, otherVehicle._id] } });
    await Product.deleteMany({ supplier: supplierProfile._id });
    await ServiceCenterProfile.deleteMany({ _id: centerProfile._id });
    await SupplierProfile.deleteMany({ _id: supplierProfile._id });
    await User.deleteMany({ _id: { $in: [owner._id, otherOwner._id, centerUser._id, supplierUser._id] } });
    await mongoose.disconnect();
  }
}

run().catch(async error => {
  console.error('Report verification failed:', error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
