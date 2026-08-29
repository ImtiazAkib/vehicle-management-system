import mongoose, { Types } from 'mongoose';

import { OrderItem } from '@/models/order-item.model';
import { Order } from '@/models/order.model';
import { Product } from '@/models/product.model';
import { SupplierProfile } from '@/models/supplier-profile.model';
import { OrderDto, OrderItemDto, orderFromEntity, orderItemFromEntity } from '@/types';

import { CODES } from '@/constants/codes.const';
import { ORDER_PAYMENT_STATUSES, ORDER_STATUSES } from '@/constants/enums.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import { ListResult, SingleResult, createError, listFailure, listSuccess, singleFailure, singleSuccess } from '@/lib/result';
import type { OrderCreateOutput } from '@/lib/schemas';
import { canAdvanceOrder, toId } from '@/lib/utils';
import type { OrderAction } from '@/lib/utils';

import { resolveSupplierProfileId } from './supplier.service';

import type { OrderItemEntity } from '@/models/order-item.model';
import type { OrderEntity } from '@/models/order.model';
import type { ProductEntity } from '@/models/product.model';

const log = createLoggerWithContext('order.service');

const DATABASE = CODES.DATABASE.ORDERS;
const VALIDATION = CODES.VALIDATION.ORDERS;
const BUSINESS = CODES.BUSINESS.ORDERS;

/** The flat delivery fee added to every order's subtotal, in minor units. */
export const ORDER_SHIPPING_FEE = 5000;

/** An order together with its line items — the shape a detail page needs in one read. */
export type OrderWithItems = {
  order: OrderDto;
  items: OrderItemDto[];
};

type PlannedLine = {
  productId: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

/** The marker a failed stock check throws inside the order transaction, naming the offending product. */
type StockShortfall = { insufficientStock: string };

function isStockShortfall(error: unknown): error is StockShortfall {
  return Boolean(error && typeof error === 'object' && 'insufficientStock' in error);
}

/**
 * Orders and their fulfillment. Placing an order reserves stock atomically and snapshots each line's price;
 * the status then moves only through the guarded transition — the supplier advances it, the buyer may
 * cancel it before it ships, and a cancel restocks exactly what it reserved.
 */
export class OrderService {
  /**
   * Place an order. Every line's `unitPrice` is snapshotted from the catalog, stock is decremented with a
   * conditional `$inc` inside one transaction — so if any line lacks stock the whole order is refused and
   * nothing is decremented — and the order starts `PENDING`, `UNPAID`.
   *
   * @param buyerId - The signed-in owner placing the order.
   * @param input - The supplier, the items and the shipping address; prices are never trusted from here.
   *
   * @returns The created order and its items, or a failure naming the cause.
   */
  public async create(buyerId: string, input: OrderCreateOutput): Promise<SingleResult<OrderWithItems>> {
    try {
      await connectToDatabase();

      if (input.items.length === 0) {
        return singleFailure(createError(VALIDATION.EMPTY_ORDER.CODE, VALIDATION.EMPTY_ORDER.MESSAGE));
      }

      const supplier = await SupplierProfile.findById(input.supplier).select('isVerified').lean<{ isVerified: boolean } | null>();

      if (!supplier || !supplier.isVerified) {
        return singleFailure(createError(VALIDATION.PRODUCT_NOT_FOUND.CODE, VALIDATION.PRODUCT_NOT_FOUND.MESSAGE));
      }

      const products = await Product.find({ _id: { $in: input.items.map(item => item.product) } }).lean<ProductEntity[]>();
      const byId = new Map(products.map(product => [toId(product._id), product]));

      const lines: PlannedLine[] = [];

      for (const item of input.items) {
        const product = byId.get(item.product);

        if (!product || !product.isActive) {
          return singleFailure(createError(VALIDATION.PRODUCT_NOT_FOUND.CODE, VALIDATION.PRODUCT_NOT_FOUND.MESSAGE));
        }

        if (toId(product.supplier) !== input.supplier) {
          return singleFailure(createError(BUSINESS.SUPPLIER_MISMATCH.CODE, BUSINESS.SUPPLIER_MISMATCH.MESSAGE));
        }

        lines.push({ productId: product._id, quantity: item.quantity, unitPrice: product.price, subtotal: product.price * item.quantity });
      }

      const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
      const shippingFee = ORDER_SHIPPING_FEE;
      const tax = 0;
      const totalAmount = subtotal + shippingFee + tax;

      const session = await mongoose.startSession();
      let orderDto: OrderDto | null = null;
      let itemDtoList: OrderItemDto[] = [];

      try {
        await session.withTransaction(async () => {
          for (const line of lines) {
            const result = await Product.updateOne(
              { _id: line.productId, stockQuantity: { $gte: line.quantity } },
              { $inc: { stockQuantity: -line.quantity } },
              { session }
            );

            if (result.modifiedCount === 0) {
              throw { insufficientStock: toId(line.productId) } satisfies StockShortfall;
            }
          }

          const [order] = await Order.create(
            [
              {
                buyer: buyerId,
                supplier: input.supplier,
                status: ORDER_STATUSES.PENDING,
                subtotal,
                shippingFee,
                tax,
                totalAmount,
                shippingAddress: input.shippingAddress,
                paymentStatus: ORDER_PAYMENT_STATUSES.UNPAID,
              },
            ],
            { session }
          );

          const items = await OrderItem.create(
            lines.map(line => ({
              order: order._id,
              product: line.productId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              subtotal: line.subtotal,
            })),
            { session }
          );

          orderDto = orderFromEntity(order);
          itemDtoList = items.map(orderItemFromEntity);
        });
      } finally {
        await session.endSession();
      }

      if (!orderDto) {
        return singleFailure(createError(DATABASE.WRITE_FAILED.CODE, DATABASE.WRITE_FAILED.MESSAGE));
      }

      return singleSuccess({ order: orderDto, items: itemDtoList });
    } catch (error) {
      if (isStockShortfall(error)) {
        return singleFailure(createError(BUSINESS.INSUFFICIENT_STOCK.CODE, BUSINESS.INSUFFICIENT_STOCK.MESSAGE, error.insufficientStock));
      }

      log.error({ err: error }, 'Placing an order failed');

      return singleFailure(createError(DATABASE.WRITE_FAILED.CODE, DATABASE.WRITE_FAILED.MESSAGE));
    }
  }

  /**
   * Advance an order along one supplier-side edge — confirm, pack, ship or deliver — scoped to the assigned
   * supplier and vetted by the {@link canAdvanceOrder} guard.
   *
   * @param supplierUserId - The signed-in supplier account.
   * @param orderId - The order to advance.
   * @param action - The fulfillment action.
   *
   * @returns The updated order, or a failure.
   */
  public async advance(supplierUserId: string, orderId: string, action: Exclude<OrderAction, 'cancel'>): Promise<SingleResult<OrderDto>> {
    try {
      await connectToDatabase();

      const order = await Order.findById(orderId);

      if (!order) {
        return singleFailure(createError(VALIDATION.ORDER_NOT_FOUND.CODE, VALIDATION.ORDER_NOT_FOUND.MESSAGE));
      }

      const supplierId = await resolveSupplierProfileId(supplierUserId);

      if (!supplierId || toId(order.supplier) !== supplierId) {
        return singleFailure(createError(BUSINESS.NOT_SELLER.CODE, BUSINESS.NOT_SELLER.MESSAGE));
      }

      const next = canAdvanceOrder(order.status, action);

      if (!next) {
        return singleFailure(createError(BUSINESS.ILLEGAL_TRANSITION.CODE, BUSINESS.ILLEGAL_TRANSITION.MESSAGE));
      }

      order.status = next;
      await order.save();

      return singleSuccess(orderFromEntity(order));
    } catch (error) {
      log.error({ err: error }, 'Advancing an order failed');

      return singleFailure(createError(DATABASE.WRITE_FAILED.CODE, DATABASE.WRITE_FAILED.MESSAGE));
    }
  }

  /**
   * Cancel an order the buyer owns, before it ships — restocking exactly the units it reserved, in one
   * transaction. Once shipped, the goods are gone and cancel is refused rather than faking a restock.
   *
   * @param buyerId - The signed-in owner who placed the order.
   * @param orderId - The order to cancel.
   *
   * @returns The cancelled order, or a failure.
   */
  public async cancel(buyerId: string, orderId: string): Promise<SingleResult<OrderDto>> {
    try {
      await connectToDatabase();

      const order = await Order.findById(orderId);

      if (!order) {
        return singleFailure(createError(VALIDATION.ORDER_NOT_FOUND.CODE, VALIDATION.ORDER_NOT_FOUND.MESSAGE));
      }

      if (toId(order.buyer) !== buyerId) {
        return singleFailure(createError(BUSINESS.NOT_BUYER.CODE, BUSINESS.NOT_BUYER.MESSAGE));
      }

      const next = canAdvanceOrder(order.status, 'cancel');

      if (!next) {
        return singleFailure(createError(BUSINESS.ILLEGAL_TRANSITION.CODE, BUSINESS.ILLEGAL_TRANSITION.MESSAGE));
      }

      const items = await OrderItem.find({ order: order._id }).lean<OrderItemEntity[]>();
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          for (const item of items) {
            await Product.updateOne({ _id: item.product }, { $inc: { stockQuantity: item.quantity } }, { session });
          }

          order.status = next;
          await order.save({ session });
        });
      } finally {
        await session.endSession();
      }

      return singleSuccess(orderFromEntity(order));
    } catch (error) {
      log.error({ err: error }, 'Cancelling an order failed');

      return singleFailure(createError(DATABASE.WRITE_FAILED.CODE, DATABASE.WRITE_FAILED.MESSAGE));
    }
  }

  /**
   * A buyer's orders, newest first.
   *
   * @param buyerId - The signed-in owner.
   *
   * @returns The orders, or a failure.
   */
  public async findForBuyer(buyerId: string): Promise<ListResult<OrderDto>> {
    try {
      await connectToDatabase();

      const orders = await Order.find({ buyer: buyerId }).sort({ placedAt: -1 }).lean<OrderEntity[]>();

      return listSuccess(orders.map(orderFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing buyer orders failed');

      return listFailure(createError(DATABASE.READ_FAILED.CODE, DATABASE.READ_FAILED.MESSAGE));
    }
  }

  /**
   * A supplier's fulfillment queue, newest first, scoped to its own profile.
   *
   * @param supplierUserId - The signed-in supplier account.
   *
   * @returns The orders, or a failure. An account without a profile yet lists nothing.
   */
  public async findForSupplier(supplierUserId: string): Promise<ListResult<OrderDto>> {
    try {
      await connectToDatabase();

      const supplierId = await resolveSupplierProfileId(supplierUserId);

      if (!supplierId) {
        return listSuccess([]);
      }

      const orders = await Order.find({ supplier: supplierId }).sort({ placedAt: -1 }).lean<OrderEntity[]>();

      return listSuccess(orders.map(orderFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing supplier orders failed');

      return listFailure(createError(DATABASE.READ_FAILED.CODE, DATABASE.READ_FAILED.MESSAGE));
    }
  }

  /**
   * One of the buyer's orders with its line items.
   *
   * @param buyerId - The signed-in owner.
   * @param orderId - The order to load.
   *
   * @returns The order and its items, or a failure.
   */
  public async getForBuyer(buyerId: string, orderId: string): Promise<SingleResult<OrderWithItems>> {
    return this.getScoped(orderId, { buyer: buyerId });
  }

  /**
   * One of the supplier's orders with its line items.
   *
   * @param supplierUserId - The signed-in supplier account.
   * @param orderId - The order to load.
   *
   * @returns The order and its items, or a failure.
   */
  public async getForSupplier(supplierUserId: string, orderId: string): Promise<SingleResult<OrderWithItems>> {
    const supplierId = await resolveSupplierProfileId(supplierUserId);

    if (!supplierId) {
      return singleFailure(createError(VALIDATION.ORDER_NOT_FOUND.CODE, VALIDATION.ORDER_NOT_FOUND.MESSAGE));
    }

    return this.getScoped(orderId, { supplier: supplierId });
  }

  /** Load one order with its items under an ownership scope, or a not-found failure. */
  private async getScoped(orderId: string, scope: Record<string, string>): Promise<SingleResult<OrderWithItems>> {
    try {
      await connectToDatabase();

      const order = await Order.findOne({ _id: orderId, ...scope }).lean<OrderEntity | null>();

      if (!order) {
        return singleFailure(createError(VALIDATION.ORDER_NOT_FOUND.CODE, VALIDATION.ORDER_NOT_FOUND.MESSAGE));
      }

      const items = await OrderItem.find({ order: order._id }).lean<OrderItemEntity[]>();

      return singleSuccess({ order: orderFromEntity(order), items: items.map(orderItemFromEntity) });
    } catch (error) {
      log.error({ err: error }, 'Loading an order failed');

      return singleFailure(createError(DATABASE.READ_FAILED.CODE, DATABASE.READ_FAILED.MESSAGE));
    }
  }
}
