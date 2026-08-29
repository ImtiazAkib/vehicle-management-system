'use server';

import { redirect } from 'next/navigation';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { getSessionUser } from '@/lib/auth';
import { SupplierProfileSchema } from '@/lib/schemas';
import { SupplierService } from '@/lib/services';

const supplierService = new SupplierService();

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
