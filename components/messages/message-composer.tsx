'use client';

import { useActionState } from 'react';

import { sendMessageAction, type FormState } from './actions';

const initial: FormState = { error: null };

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const [state, formAction, pending] = useActionState(sendMessageAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="conversationId" value={conversationId} />
      <textarea
        name="body"
        rows={2}
        required
        placeholder="Type a message…"
        className="border-input bg-card text-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2"
      />
      {state.error && <p className="text-destructive text-xs">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-primary text-primary-foreground hover:bg-primary-hover w-fit self-end rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60">
        {pending ? 'Sending…' : 'Send'}
      </button>
    </form>
  );
}
