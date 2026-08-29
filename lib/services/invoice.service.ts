import { Invoice } from '@/models/invoice.model';
import { ServiceRequest } from '@/models/service-request.model';
import { InvoiceDto, invoiceFromEntity } from '@/types';

import { CODES } from '@/constants/codes.const';
import { INVOICE_STATUSES, INVOICE_TYPES, SERVICE_REQUEST_STATUSES } from '@/constants/enums.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import { ListResult, SingleResult, createError, listFailure, listSuccess, singleFailure, singleSuccess } from '@/lib/result';
import type { ServiceInvoiceIssueOutput } from '@/lib/schemas';
import { toId } from '@/lib/utils';

import { resolveCenterProfileId } from './service-center.service';

import type { InvoiceEntity } from '@/models/invoice.model';
import type { ServiceRequestEntity } from '@/models/service-request.model';

const log = createLoggerWithContext('invoice.service');

const DATABASE = CODES.DATABASE.BILLING;
const VALIDATION = CODES.VALIDATION.BILLING;
const BUSINESS = CODES.BUSINESS.BILLING;

/** How long a freshly-issued invoice has before it is due. */
const DUE_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Service invoices. This step issues the bill for a completed booking; step 13 records the payment that
 * settles it. Every write is scoped to the center that did the work — a center bills for its own work, and
 * only its own.
 */
export class InvoiceService {
  /**
   * Issue a SERVICE invoice for a completed booking. The subtotal is the booking's final cost the service
   * already holds; the center supplies only an optional tax, and the total is derived. Refused when the
   * booking is not the center's, is not completed, or has already been invoiced.
   *
   * @param centerUserId - The signed-in service-center account.
   * @param input - The booking reference and an optional tax.
   *
   * @returns The issued invoice, or a failure.
   */
  public async issueServiceInvoice(centerUserId: string, input: ServiceInvoiceIssueOutput): Promise<SingleResult<InvoiceDto>> {
    try {
      await connectToDatabase();

      const request = await ServiceRequest.findById(input.serviceRequestId).lean<ServiceRequestEntity | null>();

      if (!request) {
        return singleFailure(createError(VALIDATION.REQUEST_NOT_FOUND.CODE, VALIDATION.REQUEST_NOT_FOUND.MESSAGE));
      }

      const profileId = await resolveCenterProfileId(centerUserId);

      if (!profileId || toId(request.serviceCenter) !== profileId) {
        return singleFailure(createError(BUSINESS.NOT_ASSIGNED_CENTER.CODE, BUSINESS.NOT_ASSIGNED_CENTER.MESSAGE));
      }

      if (request.status !== SERVICE_REQUEST_STATUSES.COMPLETED || request.finalCost == null) {
        return singleFailure(createError(BUSINESS.BOOKING_NOT_COMPLETED.CODE, BUSINESS.BOOKING_NOT_COMPLETED.MESSAGE));
      }

      const existing = await Invoice.findOne({ type: INVOICE_TYPES.SERVICE, reference: request._id }).lean<InvoiceEntity | null>();

      if (existing) {
        return singleFailure(createError(BUSINESS.ALREADY_INVOICED.CODE, BUSINESS.ALREADY_INVOICED.MESSAGE));
      }

      const subtotal = request.finalCost;
      const tax = input.tax ?? 0;
      const issuedAt = new Date();

      const invoice = await Invoice.create({
        type: INVOICE_TYPES.SERVICE,
        reference: request._id,
        owner: request.owner,
        issuedBy: centerUserId,
        subtotal,
        tax,
        total: subtotal + tax,
        status: INVOICE_STATUSES.UNPAID,
        issuedAt,
        dueDate: new Date(issuedAt.getTime() + DUE_AFTER_MS),
      });

      return singleSuccess(invoiceFromEntity(invoice));
    } catch (error) {
      log.error({ err: error }, 'Issuing a service invoice failed');

      return singleFailure(createError(DATABASE.WRITE_FAILED.CODE, DATABASE.WRITE_FAILED.MESSAGE));
    }
  }

  /**
   * The invoices a center has issued, newest first.
   *
   * @param centerUserId - The signed-in service-center account.
   *
   * @returns The invoices, or a failure.
   */
  public async listIssuedByCenter(centerUserId: string): Promise<ListResult<InvoiceDto>> {
    try {
      await connectToDatabase();

      const invoices = await Invoice.find({ issuedBy: centerUserId, type: INVOICE_TYPES.SERVICE }).sort({ issuedAt: -1 }).lean<InvoiceEntity[]>();

      return listSuccess(invoices.map(invoiceFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing center invoices failed');

      return listFailure(createError(DATABASE.READ_FAILED.CODE, DATABASE.READ_FAILED.MESSAGE));
    }
  }
}
