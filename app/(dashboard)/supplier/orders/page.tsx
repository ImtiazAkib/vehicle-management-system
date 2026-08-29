import type { Route } from 'next';

import Link from 'next/link';

import { ClipboardList } from 'lucide-react';

import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';
import { OrderService } from '@/lib/services';
import { formatPriceLabel } from '@/lib/utils';

import { EmptyState, PageHeader } from '@/components/shared';

const orderService = new OrderService();

export default async function SupplierOrdersPage() {
  const supplier = await requireRole(USER_ROLES.SUPPLIER);
  const orders = (await orderService.findForSupplier(supplier.userId)).result ?? [];

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Orders" description="Your fulfillment queue — confirm, pack, ship and deliver." />

      {orders.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No orders yet" description="Orders buyers place against your catalog appear here." />
      ) : (
        <ul className="flex flex-col gap-2">
          {orders.map(order => (
            <li key={order.orderId}>
              <Link
                href={`/supplier/orders/${order.orderId}` as Route}
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
