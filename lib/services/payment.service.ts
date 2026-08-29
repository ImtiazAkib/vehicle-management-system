import mongoose from 'mongoose';

import { Invoice } from '@/models/invoice.model';
import { Order } from '@/models/order.model';
import { Payment } from '@/models/payment.model';
import { InvoiceDto, invoiceFromEntity } from '@/types';

import { CODES } from '@/constants/codes.const';
import { INVOICE_STATUSES, INVOICE_TYPES, ORDER_PAYMENT_STATUSES, PAYMENT_STATUSES } from '@/constants/enums.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import { SingleResult, createError, singleFailure, singleSuccess } from '@/lib/result';
import type { PaymentRecordOutput } from '@/lib/schemas';
import { toId } from '@/lib/utils';

import type { PaymentEntity } from '@/models/payment.model';

const log = createLoggerWithContext('payment.service');

const DATABASE = CODES.DATABASE.BILLING;
const VALIDATION = CODES.VALIDATION.BILLING;
const BUSINESS = CODES.BUSINESS.BILLING;

/**
 * Payments against invoices. Settlement is recorded in MongoDB — no card gateway — and when the recorded
 * `SUCCEEDED` payments cover an invoice's total, the invoice flips to `PAID`; for an ORDER invoice the
 * referenced order's `paymentStatus` flips too, in the same transaction, so a paid invoice never stands
 * against an unpaid order.
 */
export class PaymentService {
  /**
   * Record a payment the owner made against one of their invoices, and settle the invoice when it is
   * covered. The whole thing — the payment row, the possible `PAID` flip and the order flip — is one
   * transaction: two rows or neither.
   *
   * @param payerUserId - The signed-in owner the invoice is addressed to.
   * @param input - The invoice, the amount, the method and an optional reference.
   *
   * @returns The invoice as it stands after the payment, or a failure.
   */
  public async recordPayment(payerUserId: string, input: PaymentRecordOutput): Promise<SingleResult<InvoiceDto>> {
    try {
      await connectToDatabase();

      const invoice = await Invoice.findById(input.invoiceId);

      if (!invoice) {
        return singleFailure(createError(VALIDATION.INVOICE_NOT_FOUND.CODE, VALIDATION.INVOICE_NOT_FOUND.MESSAGE));
      }

      if (toId(invoice.owner) !== payerUserId) {
        return singleFailure(createError(BUSINESS.NOT_PAYER.CODE, BUSINESS.NOT_PAYER.MESSAGE));
      }

      if (invoice.status === INVOICE_STATUSES.PAID || invoice.status === INVOICE_STATUSES.CANCELLED) {
        return singleFailure(createError(BUSINESS.INVOICE_NOT_PAYABLE.CODE, BUSINESS.INVOICE_NOT_PAYABLE.MESSAGE));
      }

      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          await Payment.create(
            [
              {
                invoice: invoice._id,
                amount: input.amount,
                method: input.method,
                status: PAYMENT_STATUSES.SUCCEEDED,
                transactionRef: input.transactionRef,
                paidAt: new Date(),
              },
            ],
            { session }
          );

          const rows = await Payment.find({ invoice: invoice._id, status: PAYMENT_STATUSES.SUCCEEDED }).session(session).lean<PaymentEntity[]>();
          const paid = rows.reduce((sum, row) => sum + row.amount, 0);

          if (paid >= invoice.total) {
            invoice.status = INVOICE_STATUSES.PAID;
            invoice.paidAt = new Date();
            await invoice.save({ session });

            if (invoice.type === INVOICE_TYPES.ORDER) {
              await Order.updateOne({ _id: invoice.reference }, { $set: { paymentStatus: ORDER_PAYMENT_STATUSES.PAID } }, { session });
            }
          }
        });
      } finally {
        await session.endSession();
      }

      return singleSuccess(invoiceFromEntity(invoice));
    } catch (error) {
      log.error({ err: error }, 'Recording a payment failed');

      return singleFailure(createError(DATABASE.WRITE_FAILED.CODE, DATABASE.WRITE_FAILED.MESSAGE));
    }
  }
}
