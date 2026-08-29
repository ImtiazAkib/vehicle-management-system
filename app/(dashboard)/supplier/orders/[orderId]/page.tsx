import Link from 'next/link';
import { notFound } from 'next/navigation';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';
import { OrderService } from '@/lib/services';
import { formatPriceLabel } from '@/lib/utils';

import { PageHeader } from '@/components/shared';
import { OrderStatusControl } from '@/components/supplier';

const orderService = new OrderService();

type Params = Promise<{ orderId: string }>;

export default async function SupplierOrderDetailPage({ params }: { params: Params }) {
  const supplier = await requireRole(USER_ROLES.SUPPLIER);

  const { orderId } = await params;
  const result = await orderService.getForSupplier(supplier.userId, orderId);

  if (!result.success || !result.result) {
    notFound();
  }

  const { order, items } = result.result;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Order"
        description={`${order.status.toLowerCase()} · ${order.paymentStatus.toLowerCase()} · placed ${new Date(order.placedAt).toLocaleDateString()}`}
        action={<OrderStatusControl orderId={order.orderId} status={order.status} />}
      />

      <div className="surface-card flex max-w-xl flex-col gap-3 p-6">
        <h2 className="text-sm font-semibold">Items</h2>
        <ul className="flex flex-col gap-2">
          {items.map(item => (
            <li key={item.orderItemId} className="flex items-center justify-between gap-4 text-sm">
              <span>
                {item.quantity} × {formatPriceLabel(item.unitPrice)}
              </span>
              <span className="font-medium">{formatPriceLabel(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="border-border mt-2 flex flex-col gap-1 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPriceLabel(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>{formatPriceLabel(order.shippingFee)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatPriceLabel(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="surface-card flex max-w-xl flex-col gap-1 p-6 text-sm">
        <h2 className="text-sm font-semibold">Deliver to</h2>
        <p>
          {order.shippingAddress.line1}
          {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}
        </p>
        <p className="text-muted-foreground">
          {order.shippingAddress.city}
          {order.shippingAddress.postalCode ? ` ${order.shippingAddress.postalCode}` : ''}
          {order.shippingAddress.phone ? ` · ${order.shippingAddress.phone}` : ''}
        </p>
      </div>

      <Link href={ROUTES.SUPPLIER_ORDERS.HREF} className="text-muted-foreground text-sm underline-offset-4 hover:underline">
        ← Back to orders
      </Link>
    </section>
  );
}
