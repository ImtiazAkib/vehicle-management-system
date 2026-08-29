import Link from 'next/link';
import { notFound } from 'next/navigation';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';
import { OrderService } from '@/lib/services';
import { canAdvanceOrder, formatPriceLabel } from '@/lib/utils';

import { cancelOrderAction } from '@/components/marketplace/actions';
import { PageHeader } from '@/components/shared';

const orderService = new OrderService();

type Params = Promise<{ orderId: string }>;

export default async function OwnerOrderDetailPage({ params }: { params: Params }) {
  const owner = await requireRole(USER_ROLES.OWNER);

  const { orderId } = await params;
  const result = await orderService.getForBuyer(owner.userId, orderId);

  if (!result.success || !result.result) {
    notFound();
  }

  const { order, items } = result.result;
  const cancellable = canAdvanceOrder(order.status, 'cancel') !== null;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Order"
        description={`${order.status.toLowerCase()} · ${order.paymentStatus.toLowerCase()} · placed ${new Date(order.placedAt).toLocaleDateString()}`}
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
        <h2 className="text-sm font-semibold">Delivery</h2>
        <p>
          {order.shippingAddress.line1}
          {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}
        </p>
        <p className="text-muted-foreground">
          {order.shippingAddress.city}
          {order.shippingAddress.postalCode ? ` ${order.shippingAddress.postalCode}` : ''}
        </p>
      </div>

      {cancellable && (
        <form action={cancelOrderAction}>
          <input type="hidden" name="orderId" value={order.orderId} />
          <button type="submit" className="border-border hover:bg-muted rounded-md border px-4 py-2 text-sm font-medium transition-colors">
            Cancel order
          </button>
        </form>
      )}

      <Link href={ROUTES.OWNER_ORDERS.HREF} className="text-muted-foreground text-sm underline-offset-4 hover:underline">
        ← Back to orders
      </Link>
    </section>
  );
}
