'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { getSessionUser } from '@/lib/auth';
import { OrderStatusSchema, SupplierProfileSchema } from '@/lib/schemas';
import { OrderService, SupplierService } from '@/lib/services';

const supplierService = new SupplierService();
const orderService = new OrderService();

export type FormState = {
  error: string | null;
};

async function requireSupplier() {
  const session = await getSessionUser();

  return session && session.role === USER_ROLES.SUPPLIER ? session : null;
}

/** Update the signed-in supplier's own business profile. */
export async function updateSupplierProfileAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const supplier = await requireSupplier();

  if (!supplier) {
    return { error: 'You must be signed in as a supplier.' };
  }

  const parsed = SupplierProfileSchema.safeParse({
    businessName: formData.get('businessName'),
    address: formData.get('address'),
    city: formData.get('city'),
    phone: formData.get('phone'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' };
  }

  const result = await supplierService.updateOwnProfile(supplier.userId, parsed.data);

  if (!result.success) {
    return { error: result.errors[0]?.error ?? 'Could not save the profile.' };
  }

  redirect(ROUTES.SUPPLIER_PROFILE.HREF);
}

/** Advance one of the supplier's orders — confirm, pack, ship or deliver. */
export async function advanceOrderAction(formData: FormData): Promise<void> {
  const supplier = await requireSupplier();

  if (!supplier) {
    return;
  }

  const parsed = OrderStatusSchema.safeParse({ orderId: formData.get('orderId'), action: formData.get('action') });

  if (!parsed.success || parsed.data.action === 'cancel') {
    return;
  }

  await orderService.advance(supplier.userId, parsed.data.orderId, parsed.data.action);

  revalidatePath(ROUTES.SUPPLIER_ORDERS.HREF);
}
