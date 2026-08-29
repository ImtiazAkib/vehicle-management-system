'use server';

import { revalidatePath } from 'next/cache';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { getSessionUser } from '@/lib/auth';
import { OrderInvoiceIssueSchema, PaymentRecordSchema } from '@/lib/schemas';
import { InvoiceService, PaymentService } from '@/lib/services';

const invoiceService = new InvoiceService();
const paymentService = new PaymentService();

export type FormState = {
  error: string | null;
};

async function requireOwner() {
  const session = await getSessionUser();

  return session && session.role === USER_ROLES.OWNER ? session : null;
}

async function requireSupplier() {
  const session = await getSessionUser();

  return session && session.role === USER_ROLES.SUPPLIER ? session : null;
}

/** Record a payment the signed-in owner made against one of their invoices. */
export async function recordPaymentAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const owner = await requireOwner();

  if (!owner) {
    return { error: 'You must be signed in as a vehicle owner.' };
  }

  const parsed = PaymentRecordSchema.safeParse({
    invoiceId: formData.get('invoiceId'),
    amount: formData.get('amount'),
    method: formData.get('method'),
    transactionRef: formData.get('transactionRef') ?? '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' };
  }

  const result = await paymentService.recordPayment(owner.userId, parsed.data);

  if (!result.success) {
    return { error: result.errors[0]?.error ?? 'Could not record the payment.' };
  }

  revalidatePath(ROUTES.OWNER_INVOICES.HREF);

  return { error: null };
}

/** Issue an ORDER invoice for one of the signed-in supplier's orders. */
export async function issueOrderInvoiceAction(formData: FormData): Promise<void> {
  const supplier = await requireSupplier();

  if (!supplier) {
    return;
  }

  const parsed = OrderInvoiceIssueSchema.safeParse({ orderId: formData.get('orderId') });

  if (!parsed.success) {
    return;
  }

  await invoiceService.issueOrderInvoice(supplier.userId, parsed.data);

  revalidatePath(ROUTES.SUPPLIER_INVOICES.HREF);
}
