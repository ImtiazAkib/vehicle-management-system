'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { getSessionUser } from '@/lib/auth';
import { ProductCreateSchema } from '@/lib/schemas';
import { ProductService } from '@/lib/services';

const productService = new ProductService();

export type FormState = {
  error: string | null;
};

async function requireSupplier() {
  const session = await getSessionUser();

  return session && session.role === USER_ROLES.SUPPLIER ? session : null;
}

/** List a product for the signed-in supplier. */
export async function createProductAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const supplier = await requireSupplier();

  if (!supplier) {
    return { error: 'You must be signed in as a supplier.' };
  }

  const parsed = ProductCreateSchema.safeParse({
    name: formData.get('name'),
    category: formData.get('category'),
    sku: formData.get('sku'),
    description: formData.get('description') ?? '',
    price: formData.get('price'),
    stockQuantity: formData.get('stockQuantity'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' };
  }

  const result = await productService.create(supplier.userId, parsed.data);

  if (!result.success) {
    return { error: result.errors[0]?.error ?? 'Could not list the product.' };
  }

  redirect(ROUTES.SUPPLIER_PRODUCTS.HREF);
}

/** Activate or deactivate one of the supplier's own products. */
export async function setProductActiveAction(formData: FormData): Promise<void> {
  const supplier = await requireSupplier();

  if (!supplier) {
    return;
  }

  const productId = formData.get('productId');
  const isActive = formData.get('isActive') === 'true';

  if (typeof productId === 'string' && productId) {
    await productService.setActive(supplier.userId, productId, isActive);
  }

  revalidatePath(ROUTES.SUPPLIER_PRODUCTS.HREF);
}
