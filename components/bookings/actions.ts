'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { getSessionUser } from '@/lib/auth';
import { BookingCreateSchema, BookingTransitionSchema } from '@/lib/schemas';
import { ServiceRequestService } from '@/lib/services';

const service = new ServiceRequestService();

export type FormState = {
  error: string | null;
};

/** Book a service for the signed-in owner. */
export async function createBookingAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const session = await getSessionUser();

  if (!session || session.role !== USER_ROLES.OWNER) {
    return { error: 'You must be signed in as a vehicle owner.' };
  }

  const parsed = BookingCreateSchema.safeParse({
    vehicleId: formData.get('vehicleId'),
    serviceCenterId: formData.get('serviceCenterId'),
    serviceType: formData.get('serviceType'),
    description: formData.get('description') ?? '',
    priority: formData.get('priority') ?? undefined,
    preferredDate: formData.get('preferredDate'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' };
  }

  const result = await service.create(session.userId, parsed.data);

  if (!result.success) {
    return { error: result.errors[0]?.error ?? 'Could not book the service.' };
  }

  redirect(ROUTES.OWNER_BOOKINGS.HREF);
}

/**
 * Move a booking along one edge. The service authorizes the actor and the transition guard vets the edge,
 * so this shared action serves both the owner (cancel) and the center (accept/decline/start/complete);
 * an illegal or unauthorized move is refused there and simply leaves the booking unchanged.
 */
export async function transitionBookingAction(formData: FormData): Promise<void> {
  const session = await getSessionUser();

  if (!session) {
    return;
  }

  const parsed = BookingTransitionSchema.safeParse({
    action: formData.get('action'),
    serviceRequestId: formData.get('serviceRequestId'),
    scheduledDate: formData.get('scheduledDate') ?? undefined,
    estimatedCost: formData.get('estimatedCost') ?? undefined,
    finalCost: formData.get('finalCost') ?? undefined,
    mileageAtService: formData.get('mileageAtService') ?? undefined,
    notes: formData.get('notes') ?? undefined,
  });

  if (!parsed.success) {
    return;
  }

  await service.transition(session.userId, parsed.data);

  revalidatePath(ROUTES.OWNER_BOOKINGS.HREF);
  revalidatePath(ROUTES.CENTER_REQUESTS.HREF);
}
