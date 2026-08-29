'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { getSessionUser } from '@/lib/auth';
import { MaintenanceScheduleCreateSchema, VehicleCreateSchema } from '@/lib/schemas';
import { MaintenanceService, VehicleService } from '@/lib/services';

const vehicleService = new VehicleService();
const maintenanceService = new MaintenanceService();

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

/** Add a maintenance schedule to one of the owner's vehicles. */
export async function createScheduleAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const owner = await requireOwner();

  if (!owner) {
    return { error: 'You must be signed in as a vehicle owner.' };
  }

  const parsed = MaintenanceScheduleCreateSchema.safeParse({
    vehicleId: formData.get('vehicleId'),
    serviceType: formData.get('serviceType'),
    intervalMonths: formData.get('intervalMonths') ?? '',
    intervalMileage: formData.get('intervalMileage') ?? '',
    nextDueDate: formData.get('nextDueDate'),
    nextDueMileage: formData.get('nextDueMileage') ?? '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' };
  }

  const result = await maintenanceService.create(owner.userId, parsed.data);

  if (!result.success) {
    return { error: result.errors[0]?.error ?? 'Could not add the schedule.' };
  }

  redirect(ROUTES.OWNER_SCHEDULES.HREF);
}

/** Remove one of the signed-in owner's schedules. */
export async function deleteScheduleAction(formData: FormData): Promise<void> {
  const owner = await requireOwner();

  if (!owner) {
    return;
  }

  const scheduleId = formData.get('scheduleId');

  if (typeof scheduleId === 'string' && scheduleId) {
    await maintenanceService.remove(owner.userId, scheduleId);
  }

  revalidatePath(ROUTES.OWNER_SCHEDULES.HREF);
}
