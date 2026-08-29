import { Types } from 'mongoose';

import { Invoice } from '@/models/invoice.model';
import { MaintenanceSchedule } from '@/models/maintenance-schedule.model';
import { OrderItem } from '@/models/order-item.model';
import { Order } from '@/models/order.model';
import { Product } from '@/models/product.model';
import { ServiceRequest } from '@/models/service-request.model';
import { User } from '@/models/user.model';
import { Vehicle } from '@/models/vehicle.model';
import { AdminReportDto, CenterReportDto, OwnerReportDto, SupplierReportDto } from '@/types';

import { CODES } from '@/constants/codes.const';
import { INVOICE_STATUSES, INVOICE_TYPES, MAINTENANCE_SCHEDULE_STATUSES, ORDER_STATUSES, SERVICE_REQUEST_STATUSES } from '@/constants/enums.const';
import { USER_ROLES } from '@/constants/roles.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import { SingleResult, createError, singleFailure, singleSuccess } from '@/lib/result';
import { toId } from '@/lib/utils';

import { resolveCenterProfileId } from './service-center.service';
import { resolveSupplierProfileId } from './supplier.service';

const log = createLoggerWithContext('report.service');

const DATABASE = CODES.DATABASE.COMMON;

const oid = (id: string): Types.ObjectId => new Types.ObjectId(id);
const rate = (part: number, whole: number): number => (whole === 0 ? 0 : Math.round((part / whole) * 100) / 100);

/**
 * Read models over the same collections the features write — every figure a Mongo aggregation computed on
 * read, never a rollup table that could drift. Each pipeline is scoped to the requester, and money is
 * summed in integer minor units inside the pipeline, never in a page loop.
 */
export class ReportService {
  /**
   * An owner's maintenance and spend: their vehicles, schedules, how many fall due soon, and the total they
   * have paid across every settled invoice.
   *
   * @param ownerId - The signed-in owner.
   *
   * @returns The summary, or a failure.
   */
  public async ownerMaintenanceSummary(ownerId: string): Promise<SingleResult<OwnerReportDto>> {
    try {
      await connectToDatabase();

      const vehicleIds = await Vehicle.find({ owner: ownerId }).distinct('_id');

      const [vehicleCount, scheduleCount, dueSoonCount, spend] = await Promise.all([
        Vehicle.countDocuments({ owner: ownerId }),
        MaintenanceSchedule.countDocuments({ vehicle: { $in: vehicleIds } }),
        MaintenanceSchedule.countDocuments({
          vehicle: { $in: vehicleIds },
          status: { $in: [MAINTENANCE_SCHEDULE_STATUSES.DUE, MAINTENANCE_SCHEDULE_STATUSES.OVERDUE] },
        }),
        Invoice.aggregate<{ total: number }>([
          { $match: { owner: oid(ownerId), status: INVOICE_STATUSES.PAID } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
      ]);

      return singleSuccess({ vehicleCount, scheduleCount, dueSoonCount, totalSpend: spend[0]?.total ?? 0 });
    } catch (error) {
      log.error({ err: error }, 'Owner report failed');

      return singleFailure(createError(DATABASE.QUERY_FAILED.CODE, DATABASE.QUERY_FAILED.MESSAGE));
    }
  }

  /**
   * A service center's throughput: requests assigned, how many completed, the completion rate, and the
   * revenue from its settled SERVICE invoices.
   *
   * @param centerUserId - The signed-in service-center account.
   *
   * @returns The summary, or a failure.
   */
  public async serviceCenterPerformance(centerUserId: string): Promise<SingleResult<CenterReportDto>> {
    try {
      await connectToDatabase();

      const profileId = await resolveCenterProfileId(centerUserId);

      if (!profileId) {
        return singleSuccess({ requestCount: 0, completedCount: 0, completionRate: 0, revenue: 0 });
      }

      const [requestCount, completedCount, revenue] = await Promise.all([
        ServiceRequest.countDocuments({ serviceCenter: profileId }),
        ServiceRequest.countDocuments({ serviceCenter: profileId, status: SERVICE_REQUEST_STATUSES.COMPLETED }),
        Invoice.aggregate<{ total: number }>([
          { $match: { issuedBy: oid(centerUserId), type: INVOICE_TYPES.SERVICE, status: INVOICE_STATUSES.PAID } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
      ]);

      return singleSuccess({ requestCount, completedCount, completionRate: rate(completedCount, requestCount), revenue: revenue[0]?.total ?? 0 });
    } catch (error) {
      log.error({ err: error }, 'Center report failed');

      return singleFailure(createError(DATABASE.QUERY_FAILED.CODE, DATABASE.QUERY_FAILED.MESSAGE));
    }
  }

  /**
   * A supplier's sales: orders placed, how many delivered, the fulfillment rate, units sold, delivered
   * revenue, and its best-selling products.
   *
   * @param supplierUserId - The signed-in supplier account.
   *
   * @returns The summary, or a failure.
   */
  public async supplierSales(supplierUserId: string): Promise<SingleResult<SupplierReportDto>> {
    try {
      await connectToDatabase();

      const profileId = await resolveSupplierProfileId(supplierUserId);

      if (!profileId) {
        return singleSuccess({ orderCount: 0, deliveredCount: 0, fulfillmentRate: 0, unitsSold: 0, revenue: 0, topProducts: [] });
      }

      const deliveredOrderIds = await Order.find({ supplier: profileId, status: ORDER_STATUSES.DELIVERED }).distinct('_id');

      const [orderCount, deliveredCount, revenue, grouped] = await Promise.all([
        Order.countDocuments({ supplier: profileId }),
        Order.countDocuments({ supplier: profileId, status: ORDER_STATUSES.DELIVERED }),
        Order.aggregate<{ total: number }>([
          { $match: { supplier: oid(profileId), status: ORDER_STATUSES.DELIVERED } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
        OrderItem.aggregate<{ _id: Types.ObjectId; units: number }>([
          { $match: { order: { $in: deliveredOrderIds } } },
          { $group: { _id: '$product', units: { $sum: '$quantity' } } },
        ]),
      ]);

      const unitsSold = grouped.reduce((sum, row) => sum + row.units, 0);
      const top = [...grouped].sort((first, second) => second.units - first.units).slice(0, 5);
      const products = await Product.find({ _id: { $in: top.map(row => row._id) } })
        .select('name')
        .lean<{ _id: Types.ObjectId; name: string }[]>();
      const nameById = new Map(products.map(product => [toId(product._id), product.name]));

      return singleSuccess({
        orderCount,
        deliveredCount,
        fulfillmentRate: rate(deliveredCount, orderCount),
        unitsSold,
        revenue: revenue[0]?.total ?? 0,
        topProducts: top.map(row => ({ productId: toId(row._id), name: nameById.get(toId(row._id)) ?? 'Product', units: row.units })),
      });
    } catch (error) {
      log.error({ err: error }, 'Supplier report failed');

      return singleFailure(createError(DATABASE.QUERY_FAILED.CODE, DATABASE.QUERY_FAILED.MESSAGE));
    }
  }

  /**
   * The admin's platform-wide overview — counts across accounts, vehicles, bookings and orders, and the
   * total settled revenue. Counts only; never customer PII.
   *
   * @returns The overview, or a failure.
   */
  public async adminPlatformOverview(): Promise<SingleResult<AdminReportDto>> {
    try {
      await connectToDatabase();

      const [ownerCount, centerCount, supplierCount, vehicleCount, bookingCount, orderCount, revenue] = await Promise.all([
        User.countDocuments({ role: USER_ROLES.OWNER }),
        User.countDocuments({ role: USER_ROLES.SERVICE_CENTER }),
        User.countDocuments({ role: USER_ROLES.SUPPLIER }),
        Vehicle.countDocuments(),
        ServiceRequest.countDocuments(),
        Order.countDocuments(),
        Invoice.aggregate<{ total: number }>([{ $match: { status: INVOICE_STATUSES.PAID } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      ]);

      return singleSuccess({ ownerCount, centerCount, supplierCount, vehicleCount, bookingCount, orderCount, revenue: revenue[0]?.total ?? 0 });
    } catch (error) {
      log.error({ err: error }, 'Admin report failed');

      return singleFailure(createError(DATABASE.QUERY_FAILED.CODE, DATABASE.QUERY_FAILED.MESSAGE));
    }
  }
}
