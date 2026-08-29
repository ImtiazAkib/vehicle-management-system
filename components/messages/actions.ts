'use server';

import type { Route } from 'next';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { getSessionUser } from '@/lib/auth';
import { ConversationStartSchema, MessageSendSchema } from '@/lib/schemas';
import { MessageService } from '@/lib/services';

const messageService = new MessageService();

export type FormState = {
  error: string | null;
};

/** Start (or reopen) the conversation for one of the owner's bookings, then land on the thread. */
export async function startConversationAction(formData: FormData): Promise<void> {
  const session = await getSessionUser();

  if (!session || session.role !== USER_ROLES.OWNER) {
    return;
  }

  const parsed = ConversationStartSchema.safeParse({ serviceRequestId: formData.get('serviceRequestId') });

  if (!parsed.success) {
    return;
  }

  const result = await messageService.startOrFind(session.userId, parsed.data);

  if (!result.success || !result.result) {
    return;
  }

  redirect(`${ROUTES.OWNER_MESSAGES.HREF}?c=${result.result.conversationId}` as Route);
}

/** Post a message to a conversation as the signed-in participant. */
export async function sendMessageAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const session = await getSessionUser();

  if (!session) {
    return { error: 'You must be signed in.' };
  }

  const parsed = MessageSendSchema.safeParse({ conversationId: formData.get('conversationId'), body: formData.get('body') });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Type a message.' };
  }

  const result = await messageService.send({ userId: session.userId, role: session.role }, parsed.data);

  if (!result.success) {
    return { error: result.errors[0]?.error ?? 'Could not send the message.' };
  }

  revalidatePath(ROUTES.OWNER_MESSAGES.HREF);
  revalidatePath(ROUTES.CENTER_MESSAGES.HREF);

  return { error: null };
}
