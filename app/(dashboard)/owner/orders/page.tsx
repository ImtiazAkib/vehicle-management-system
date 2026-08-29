import type { Route } from 'next';

import Link from 'next/link';

import { ShoppingBag } from 'lucide-react';

import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';
import { OrderService } from '@/lib/services';
import { formatPriceLabel } from '@/lib/utils';

import { EmptyState, PageHeader } from '@/components/shared';

const orderService = new OrderService();

export default async function OwnerOrdersPage() {
  const owner = await requireRole(USER_ROLES.OWNER);
  const orders = (await orderService.findForBuyer(owner.userId)).result ?? [];

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Orders" description="Your marketplace orders and their fulfillment status." />

      {orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders yet" description="Browse the marketplace and place your first order." />
      ) : (
        <ul className="flex flex-col gap-2">
          {orders.map(order => (
            <li key={order.orderId}>
              <Link
                href={`/owner/orders/${order.orderId}` as Route}
                className="surface-card hover:bg-muted flex items-center justify-between gap-4 p-4 transition-colors">
                <div>
                  <p className="font-medium">{formatPriceLabel(order.totalAmount)}</p>
                  <p className="text-muted-foreground text-sm">
                    {order.status.toLowerCase()} · {order.paymentStatus.toLowerCase()} · placed {new Date(order.placedAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-muted-foreground text-sm">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
