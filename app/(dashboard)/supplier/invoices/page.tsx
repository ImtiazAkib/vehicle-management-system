import { ORDER_STATUSES } from '@/constants/enums.const';
import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';
import { InvoiceService, OrderService } from '@/lib/services';
import { formatPriceLabel } from '@/lib/utils';

import { issueOrderInvoiceAction } from '@/components/billing/actions';
import { PageHeader } from '@/components/shared';

const invoiceService = new InvoiceService();
const orderService = new OrderService();

export default async function SupplierInvoicesPage() {
  const supplier = await requireRole(USER_ROLES.SUPPLIER);

  const [invoicesResult, ordersResult] = await Promise.all([
    invoiceService.listIssuedBySupplier(supplier.userId),
    orderService.findForSupplier(supplier.userId),
  ]);

  const invoices = invoicesResult.result ?? [];
  const invoicedRefs = new Set(invoices.map(invoice => invoice.referenceId));
  const invoiceable = (ordersResult.result ?? []).filter(order => order.status !== ORDER_STATUSES.CANCELLED && !invoicedRefs.has(order.orderId));

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Invoices" description="Bill your orders and track what is owed." />

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Ready to invoice</h2>
        {invoiceable.length === 0 ? (
          <p className="text-muted-foreground text-sm">Every order has been invoiced.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {invoiceable.map(order => (
              <li key={order.orderId} className="surface-card flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{formatPriceLabel(order.totalAmount)}</p>
                  <p className="text-muted-foreground text-sm">
                    {order.status.toLowerCase()} · placed {new Date(order.placedAt).toLocaleDateString()}
                  </p>
                </div>
                <form action={issueOrderInvoiceAction}>
                  <input type="hidden" name="orderId" value={order.orderId} />
                  <button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-primary-hover rounded-md px-3 py-1.5 text-xs font-semibold transition-colors">
                    Issue invoice
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Issued</h2>
        {invoices.length === 0 ? (
          <p className="text-muted-foreground text-sm">No invoices issued yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {invoices.map(invoice => (
              <li key={invoice.invoiceId} className="surface-card flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{formatPriceLabel(invoice.total)}</p>
                  <p className="text-muted-foreground text-sm">
                    {invoice.status.toLowerCase()} · issued {new Date(invoice.issuedAt).toLocaleDateString()} · due{' '}
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
