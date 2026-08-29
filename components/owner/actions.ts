'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { getSessionUser } from '@/lib/auth';
import { VehicleCreateSchema } from '@/lib/schemas';
import { VehicleService } from '@/lib/services';

const vehicleService = new VehicleService();

export type FormState = {
  error: string | null;
};

async function requireOwner() {
  const session = await getSessionUser();

  return session && session.role === USER_ROLES.OWNER ? session : null;
}

/** Register a vehicle for the signed-in owner. */
export async function createVehicleAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const owner = await requireOwner();

  if (!owner) {
    return { error: 'You must be signed in as a vehicle owner.' };
  }

  const parsed = VehicleCreateSchema.safeParse({
    make: formData.get('make'),
    model: formData.get('model'),
    year: formData.get('year'),
    vin: formData.get('vin'),
    registrationNo: formData.get('registrationNo'),
    color: formData.get('color') || undefined,
    fuelType: formData.get('fuelType'),
    transmission: formData.get('transmission'),
    currentMileage: formData.get('currentMileage'),
    purchaseDate: formData.get('purchaseDate') ?? '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' };
  }

  const result = await vehicleService.create(owner.userId, parsed.data);

  if (!result.success) {
    return { error: result.errors[0]?.error ?? 'Could not add the vehicle.' };
  }

  redirect(ROUTES.OWNER_VEHICLES.HREF);
}

/** Remove one of the signed-in owner's vehicles. */
export async function deleteVehicleAction(formData: FormData): Promise<void> {
  const owner = await requireOwner();

  if (!owner) {
    return;
  }

  const vehicleId = formData.get('vehicleId');

  if (typeof vehicleId === 'string' && vehicleId) {
    await vehicleService.remove(owner.userId, vehicleId);
  }

  revalidatePath(ROUTES.OWNER_VEHICLES.HREF);
}
