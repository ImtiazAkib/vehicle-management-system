'use server';

import { revalidatePath } from 'next/cache';

import { gateAdminArea } from '@/lib/auth';
import { UserService } from '@/lib/services';

const userService = new UserService();

const get = (formData: FormData, key: string): string => {
  const value = formData.get(key);

  return typeof value === 'string' ? value : '';
};

/** Activate or deactivate an account. Admin-area only; the service refuses the super administrator. */
export async function setAccountActiveAction(formData: FormData): Promise<void> {
  const gate = await gateAdminArea();

  if (!gate.allowed) {
    return;
  }

  const userId = get(formData, 'userId');

  if (userId) {
    await userService.setActive(userId, get(formData, 'isActive') === 'true');
  }

  revalidatePath('/admin/users');
}

/** Verify a service center, making it transactable. */
export async function verifyServiceCenterAction(formData: FormData): Promise<void> {
  const gate = await gateAdminArea();

  if (!gate.allowed) {
    return;
  }

  const profileId = get(formData, 'profileId');

  if (profileId) {
    await userService.verifyServiceCenter(profileId);
  }

  revalidatePath('/admin/verifications');
}

/** Verify a supplier, making it transactable. */
export async function verifySupplierAction(formData: FormData): Promise<void> {
  const gate = await gateAdminArea();

  if (!gate.allowed) {
    return;
  }

  const profileId = get(formData, 'profileId');

  if (profileId) {
    await userService.verifySupplier(profileId);
  }

  revalidatePath('/admin/verifications');
}
