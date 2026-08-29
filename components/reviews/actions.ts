'use server';

import { revalidatePath } from 'next/cache';

import { REVIEW_TARGET_TYPES } from '@/constants/enums.const';
import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { getSessionUser } from '@/lib/auth';
import { ReviewCreateSchema } from '@/lib/schemas';
import { ReviewService } from '@/lib/services';

const reviewService = new ReviewService();

export type FormState = {
  error: string | null;
};

/** Create or update the signed-in owner's review of a target. */
export async function createReviewAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const session = await getSessionUser();

  if (!session || session.role !== USER_ROLES.OWNER) {
    return { error: 'Only vehicle owners can write reviews.' };
  }

  const parsed = ReviewCreateSchema.safeParse({
    targetType: formData.get('targetType'),
    targetId: formData.get('targetId'),
    rating: formData.get('rating'),
    comment: formData.get('comment') ?? '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' };
  }

  const result = await reviewService.create(session.userId, parsed.data);

  if (!result.success) {
    return { error: result.errors[0]?.error ?? 'Could not save your review.' };
  }

  if (parsed.data.targetType === REVIEW_TARGET_TYPES.PRODUCT) {
    revalidatePath(`${ROUTES.OWNER_MARKETPLACE.HREF}/${parsed.data.targetId}`);
  }

  revalidatePath(ROUTES.OWNER_BOOKINGS.HREF);
  revalidatePath(ROUTES.OWNER_ORDERS.HREF);

  return { error: null };
}
