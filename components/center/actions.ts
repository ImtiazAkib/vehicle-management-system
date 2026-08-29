'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { getSessionUser } from '@/lib/auth';
import { ServiceCenterProfileSchema, ServiceInvoiceIssueSchema } from '@/lib/schemas';
import { InvoiceService, ServiceCenterService } from '@/lib/services';

const centerService = new ServiceCenterService();
const invoiceService = new InvoiceService();

export type FormState = {
  error: string | null;
};

async function requireCenter() {
  const session = await getSessionUser();

  return session && session.role === USER_ROLES.SERVICE_CENTER ? session : null;
}

/** Update the signed-in center's own profile. */
export async function updateCenterProfileAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const center = await requireCenter();

  if (!center) {
    return { error: 'You must be signed in as a service center.' };
  }

  const parsed = ServiceCenterProfileSchema.safeParse({
    centerName: formData.get('centerName'),
    address: formData.get('address'),
    city: formData.get('city'),
    phone: formData.get('phone'),
    servicesOffered: formData.get('servicesOffered') ?? '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' };
  }

  const result = await centerService.updateOwnProfile(center.userId, parsed.data);

  if (!result.success) {
    return { error: result.errors[0]?.error ?? 'Could not save the profile.' };
  }

  redirect(ROUTES.CENTER_PROFILE.HREF);
}

/** Issue a SERVICE invoice for one of the center's completed bookings. */
export async function issueServiceInvoiceAction(formData: FormData): Promise<void> {
  const center = await requireCenter();

  if (!center) {
    return;
  }

  const parsed = ServiceInvoiceIssueSchema.safeParse({
    serviceRequestId: formData.get('serviceRequestId'),
    tax: formData.get('tax') ?? '',
  });

  if (!parsed.success) {
    return;
  }

  await invoiceService.issueServiceInvoice(center.userId, parsed.data);

  revalidatePath(ROUTES.CENTER_INVOICES.HREF);
}
