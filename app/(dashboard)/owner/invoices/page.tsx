import { ReceiptText } from 'lucide-react';

import { INVOICE_STATUSES } from '@/constants/enums.const';
import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';
import { InvoiceService } from '@/lib/services';
import { formatPriceLabel } from '@/lib/utils';

import { PaymentForm } from '@/components/billing';
import { EmptyState, PageHeader } from '@/components/shared';

const invoiceService = new InvoiceService();

const PAYABLE: string[] = [INVOICE_STATUSES.UNPAID, INVOICE_STATUSES.OVERDUE];

export default async function OwnerInvoicesPage() {
  const owner = await requireRole(USER_ROLES.OWNER);
  const invoices = (await invoiceService.listForPayer(owner.userId)).result ?? [];

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Invoices" description="Bills for your services and orders. Record a payment to settle one." />

      {invoices.length === 0 ? (
        <EmptyState icon={ReceiptText} title="No invoices yet" description="Invoices for your completed services and orders appear here." />
      ) : (
        <ul className="flex flex-col gap-2">
          {invoices.map(invoice => (
            <li key={invoice.invoiceId} className="surface-card flex flex-col gap-3 p-4">
              <div>
                <p className="font-medium">{formatPriceLabel(invoice.total)}</p>
                <p className="text-muted-foreground text-sm">
                  {invoice.type.toLowerCase()} · {invoice.status.toLowerCase()} · due {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
              {PAYABLE.includes(invoice.status) && (
                <div className="border-border border-t pt-3">
                  <PaymentForm invoiceId={invoice.invoiceId} defaultAmount={invoice.total} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
