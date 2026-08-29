import mongoose from 'mongoose';

import { Invoice } from '@/models/invoice.model';
import { MaintenanceRecord } from '@/models/maintenance-record.model';
import { OrderItem } from '@/models/order-item.model';
import { Order } from '@/models/order.model';
import { Payment } from '@/models/payment.model';
import { Product } from '@/models/product.model';
import { ServiceCenterProfile } from '@/models/service-center-profile.model';
import { ServiceRequest } from '@/models/service-request.model';
import { SupplierProfile } from '@/models/supplier-profile.model';
import { User } from '@/models/user.model';
import { Vehicle } from '@/models/vehicle.model';

import { CODES } from '@/constants/codes.const';
import {
  INVOICE_STATUSES,
  INVOICE_TYPES,
  ORDER_PAYMENT_STATUSES,
  PAYMENT_METHODS,
  PRODUCT_CATEGORIES,
  SERVICE_REQUEST_PRIORITIES,
} from '@/constants/enums.const';
import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';
import type { SingleResult } from '@/lib/result';
import { InvoiceService, OrderService, PaymentService, ServiceRequestService } from '@/lib/services';
import { toId } from '@/lib/utils';

import type { InvoiceDto } from '@/types';

/*
  A live-database walk of billing: issuing SERVICE and ORDER invoices, recording payments, and the covering
  payment that flips both the invoice and (for an ORDER) its order to PAID in one transaction. Fixtures are
  namespaced by a run tag and removed in `finally`.
*/
const BUSINESS = CODES.BUSINESS.BILLING;

const requestService = new ServiceRequestService();
const invoiceService = new InvoiceService();
const orderService = new OrderService();
const paymentService = new PaymentService();

let checks = 0;

function pass(message: string): void {
  checks += 1;
  console.log(`  ok — ${message}`);
}

function expectInvoice(result: SingleResult<InvoiceDto>, context: string): InvoiceDto {
  if (!result.success || result.result === null) {
    throw new Error(`${context}: expected success but got ${result.errors[0]?.error ?? 'no result'}`);
  }
  return result.result;
}

function expectInvoiceFailure(result: SingleResult<InvoiceDto>, code: number, message: string): void {
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
  console.log(`Connected to "${mongoose.connection.name}". Verifying invoices…`);

  const tag = `verify-invoices-${Date.now()}`;
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

  const centerBase = { address: '1 Test Road', city: 'Dhaka', phone: '018000000' };
  const profileA = await ServiceCenterProfile.create({ user: centerUserA._id, centerName: `${tag} A`, ...centerBase, isVerified: true });
  const profileB = await ServiceCenterProfile.create({ user: centerUserB._id, centerName: `${tag} B`, ...centerBase, isVerified: true });

  const supplierUser = await User.create({ ...account('supplier'), role: USER_ROLES.SUPPLIER });
  const supplierProfile = await SupplierProfile.create({ user: supplierUser._id, businessName: `${tag} S`, ...centerBase, isVerified: true });
  const product = await Product.create({
    supplier: supplierProfile._id,
    name: `${tag} part`,
    category: PRODUCT_CATEGORIES.FILTER,
    sku: `${tag}-SKU`,
    price: 10000,
    stockQuantity: 10,
    isActive: true,
  });

  const vehicle = await Vehicle.create({
    owner: owner._id,
    make: 'Toyota',
    model: 'Corolla',
    year: 2020,
    vin: `INV${Date.now()}`,
    registrationNo: `REG${Date.now()}`,
    fuelType: 'PETROL',
    transmission: 'MANUAL',
    currentMileage: 1000,
  });

  const ownerId = toId(owner._id);
  const centerAId = toId(centerUserA._id);
  const centerBId = toId(centerUserB._id);

  try {
    const created = await requestService.create(ownerId, {
      vehicleId: toId(vehicle._id),
      serviceCenterId: toId(profileA._id),
      serviceType: 'Oil change',
      priority: SERVICE_REQUEST_PRIORITIES.NORMAL,
      preferredDate: new Date(),
    });

    if (!created.success || created.result === null) {
      throw new Error('setup: could not create the booking');
    }

    const bookingId = created.result.serviceRequestId;
    await requestService.transition(centerAId, { action: 'accept', serviceRequestId: bookingId, scheduledDate: new Date(), estimatedCost: 500000 });
    await requestService.transition(centerAId, { action: 'start', serviceRequestId: bookingId });
    await requestService.transition(centerAId, { action: 'complete', serviceRequestId: bookingId, finalCost: 600000, mileageAtService: 5000 });

    // A center cannot invoice a booking that is not its own.
    const foreign = await invoiceService.issueServiceInvoice(centerBId, { serviceRequestId: bookingId, tax: 5000 });
    expectInvoiceFailure(foreign, BUSINESS.NOT_ASSIGNED_CENTER.CODE, "a center cannot invoice another center's booking");

    // The assigned center issues an UNPAID SERVICE invoice with integer minor-unit totals.
    const invoice = expectInvoice(await invoiceService.issueServiceInvoice(centerAId, { serviceRequestId: bookingId, tax: 5000 }), 'issue');
    const integers = Number.isInteger(invoice.subtotal) && Number.isInteger(invoice.tax) && Number.isInteger(invoice.total);
    if (invoice.type !== INVOICE_TYPES.SERVICE || invoice.status !== INVOICE_STATUSES.UNPAID || !integers) {
      throw new Error('a SERVICE invoice must be UNPAID with integer minor-unit totals');
    }
    if (invoice.subtotal !== 600000 || invoice.tax !== 5000 || invoice.total !== 605000) {
      throw new Error(`totals must derive from the final cost — got ${invoice.subtotal}/${invoice.tax}/${invoice.total}`);
    }
    pass('the assigned center issues an UNPAID SERVICE invoice with derived integer totals');

    // Issuing twice is refused.
    const again = await invoiceService.issueServiceInvoice(centerAId, { serviceRequestId: bookingId, tax: 5000 });
    expectInvoiceFailure(again, BUSINESS.ALREADY_INVOICED.CODE, 'a booking cannot be invoiced twice');

    // Listings are scoped to the issuing center.
    const mine = (await invoiceService.listIssuedByCenter(centerAId)).result ?? [];
    const theirs = (await invoiceService.listIssuedByCenter(centerBId)).result ?? [];
    if (mine.length !== 1 || theirs.length !== 0) {
      throw new Error(`invoice listings must be center-scoped — got ${mine.length} and ${theirs.length}`);
    }
    pass('invoice listings are scoped to the issuing center');

    // A non-payer cannot record a payment against the SERVICE invoice (total 605000).
    const notPayer = await paymentService.recordPayment(centerAId, { invoiceId: invoice.invoiceId, amount: 605000, method: PAYMENT_METHODS.CASH });
    expectInvoiceFailure(notPayer, BUSINESS.NOT_PAYER.CODE, 'only the payer can record a payment');

    // A short payment leaves the invoice UNPAID; the covering remainder flips it to PAID.
    const partial = expectInvoice(
      await paymentService.recordPayment(ownerId, { invoiceId: invoice.invoiceId, amount: 100000, method: PAYMENT_METHODS.CASH }),
      'partial payment'
    );
    if (partial.status !== INVOICE_STATUSES.UNPAID) {
      throw new Error('a short payment must leave the invoice UNPAID');
    }
    pass('a short payment leaves the invoice UNPAID');

    const settled = expectInvoice(
      await paymentService.recordPayment(ownerId, { invoiceId: invoice.invoiceId, amount: 505000, method: PAYMENT_METHODS.BANK_TRANSFER }),
      'covering payment'
    );
    if (settled.status !== INVOICE_STATUSES.PAID) {
      throw new Error('a covering payment must flip the invoice to PAID');
    }
    pass('a covering payment flips the SERVICE invoice to PAID');

    // An ORDER invoice, settled, flips both the invoice and its order to PAID in one transaction.
    const orderResult = await orderService.create(ownerId, {
      supplier: toId(supplierProfile._id),
      items: [{ product: toId(product._id), quantity: 2 }],
      shippingAddress: { line1: '1 Buyer Lane', city: 'Dhaka' },
    });
    if (!orderResult.success || orderResult.result === null) {
      throw new Error('setup: could not place the order');
    }
    const placedOrderId = orderResult.result.order.orderId;

    const orderInvoice = expectInvoice(
      await invoiceService.issueOrderInvoice(toId(supplierUser._id), { orderId: placedOrderId }),
      'issue order invoice'
    );
    if (
      orderInvoice.type !== INVOICE_TYPES.ORDER ||
      orderInvoice.status !== INVOICE_STATUSES.UNPAID ||
      orderInvoice.subtotal + orderInvoice.tax !== orderInvoice.total
    ) {
      throw new Error('an ORDER invoice must be UNPAID with reconciling integer totals');
    }
    pass('a supplier issues an UNPAID ORDER invoice with reconciling totals');

    const paidOrderInvoice = expectInvoice(
      await paymentService.recordPayment(ownerId, { invoiceId: orderInvoice.invoiceId, amount: orderInvoice.total, method: PAYMENT_METHODS.WALLET }),
      'settle order invoice'
    );
    const orderAfter = await Order.findById(placedOrderId).select('paymentStatus').lean<{ paymentStatus: string } | null>();
    if (paidOrderInvoice.status !== INVOICE_STATUSES.PAID || orderAfter?.paymentStatus !== ORDER_PAYMENT_STATUSES.PAID) {
      throw new Error('settling an ORDER invoice must flip both the invoice and the order to PAID');
    }
    pass('settling an ORDER invoice flips the invoice and the order to PAID in one transaction');

    console.log(`\nAll ${checks} checks passed.`);
  } finally {
    const invoiceIds = await Invoice.find({ owner: owner._id }).distinct('_id');
    await Payment.deleteMany({ invoice: { $in: invoiceIds } });
    await Invoice.deleteMany({ owner: owner._id });
    const orderIds = await Order.find({ buyer: owner._id }).distinct('_id');
    await OrderItem.deleteMany({ order: { $in: orderIds } });
    await Order.deleteMany({ buyer: owner._id });
    await Product.deleteMany({ supplier: supplierProfile._id });
    await MaintenanceRecord.deleteMany({ vehicle: vehicle._id });
    await ServiceRequest.deleteMany({ owner: owner._id });
    await Vehicle.deleteMany({ _id: vehicle._id });
    await ServiceCenterProfile.deleteMany({ _id: { $in: [profileA._id, profileB._id] } });
    await SupplierProfile.deleteMany({ _id: supplierProfile._id });
    await User.deleteMany({ _id: { $in: [owner._id, centerUserA._id, centerUserB._id, supplierUser._id] } });
    await mongoose.disconnect();
  }
}

run().catch(async error => {
  console.error('Invoice verification failed:', error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
