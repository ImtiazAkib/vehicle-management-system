import { APP_DATA } from '@/constants/app-data.const';
import { SERVICE_REQUEST_STATUSES } from '@/constants/enums.const';
import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';
import { InvoiceService, ServiceRequestService } from '@/lib/services';
import { formatPriceLabel } from '@/lib/utils';

import { issueServiceInvoiceAction } from '@/components/center/actions';
import { PageHeader } from '@/components/shared';

const invoiceService = new InvoiceService();
const requestService = new ServiceRequestService();

export default async function CenterInvoicesPage() {
  const center = await requireRole(USER_ROLES.SERVICE_CENTER);

  const [invoicesResult, requestsResult] = await Promise.all([
    invoiceService.listIssuedByCenter(center.userId),
    requestService.findForCenter(center.userId),
  ]);

  const invoices = invoicesResult.result ?? [];
  const invoiceByReference = new Map(invoices.map(invoice => [invoice.referenceId, invoice]));
  const completed = (requestsResult.result ?? []).filter(request => request.status === SERVICE_REQUEST_STATUSES.COMPLETED);
  const uninvoiced = completed.filter(request => !invoiceByReference.has(request.serviceRequestId));

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Invoices" description="Bill completed bookings and track what is owed." />

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Ready to invoice</h2>
        {uninvoiced.length === 0 ? (
          <p className="text-muted-foreground text-sm">Every completed booking has been invoiced.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {uninvoiced.map(request => (
              <li key={request.serviceRequestId} className="surface-card flex flex-wrap items-end justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{request.serviceType}</p>
                  <p className="text-muted-foreground text-sm">
                    completed · {request.finalCost != null ? formatPriceLabel(request.finalCost) : '—'} subtotal
                  </p>
                </div>
                <form action={issueServiceInvoiceAction} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="serviceRequestId" value={request.serviceRequestId} />
                  <label className="flex flex-col gap-1 text-xs font-medium">
                    Tax ({APP_DATA.CURRENCY.SYMBOL}, optional)
                    <input
                      type="text"
                      name="tax"
                      inputMode="decimal"
                      placeholder="0.00"
                      className="border-input bg-card text-foreground focus-visible:ring-ring rounded-md border px-2 py-1 text-xs font-normal outline-none focus-visible:ring-2"
                    />
                  </label>
                  <button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-primary-hover rounded-md px-2 py-1 text-xs font-semibold">
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
