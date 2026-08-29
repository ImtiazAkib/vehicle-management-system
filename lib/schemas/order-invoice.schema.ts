import { z } from 'zod';

/*
  Issuing an ORDER invoice. The amounts are the order's own — snapshotted subtotal, shipping and tax — so
  the supplier supplies only the order reference; the totals are never re-typed and cannot drift from the
  order they bill.
*/
export const OrderInvoiceIssueSchema = z.object({
  orderId: z.string().min(1, 'Missing order.'),
});

export type OrderInvoiceIssueOutput = z.output<typeof OrderInvoiceIssueSchema>;
