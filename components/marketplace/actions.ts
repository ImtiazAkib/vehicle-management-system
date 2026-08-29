'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { getSessionUser } from '@/lib/auth';
import { OrderCreateSchema, ProductCreateSchema } from '@/lib/schemas';
import { OrderService, ProductService } from '@/lib/services';

const productService = new ProductService();
const orderService = new OrderService();

export type FormState = {
  error: string | null;
};

async function requireSupplier() {
  const session = await getSessionUser();

  return session && session.role === USER_ROLES.SUPPLIER ? session : null;
}

async function requireOwner() {
  const session = await getSessionUser();

  return session && session.role === USER_ROLES.OWNER ? session : null;
}

/** Place a single-product order for the signed-in owner. */
export async function createOrderAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const owner = await requireOwner();

  if (!owner) {
    return { error: 'You must be signed in as a vehicle owner.' };
  }

  const parsed = OrderCreateSchema.safeParse({
    supplier: formData.get('supplierId'),
    items: [{ product: formData.get('productId'), quantity: formData.get('quantity') }],
    shippingAddress: {
      line1: formData.get('line1'),
      line2: formData.get('line2') ?? '',
      city: formData.get('city'),
      postalCode: formData.get('postalCode') ?? '',
      phone: formData.get('phone') ?? '',
    },
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' };
  }

  const result = await orderService.create(owner.userId, parsed.data);

  if (!result.success) {
    return { error: result.errors[0]?.error ?? 'Could not place the order.' };
  }

  redirect(ROUTES.OWNER_ORDERS.HREF);
}

/** Cancel one of the signed-in owner's orders, before it ships. */
export async function cancelOrderAction(formData: FormData): Promise<void> {
  const owner = await requireOwner();

  if (!owner) {
    return;
  }

  const orderId = formData.get('orderId');

  if (typeof orderId === 'string' && orderId) {
    await orderService.cancel(owner.userId, orderId);
  }

  revalidatePath(ROUTES.OWNER_ORDERS.HREF);
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
