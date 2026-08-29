'use client';

import { useActionState } from 'react';

import { resetPasswordAction, type FormState } from './actions';
import { Field, SubmitButton } from './field';

const initial: FormState = { error: null };

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <Field label="New password" name="password" type="password" autoComplete="new-password" required />

      {state.error && <p className="text-destructive text-sm">{state.error}</p>}

      <SubmitButton pending={pending}>{pending ? 'Saving…' : 'Set new password'}</SubmitButton>
    </form>
  );
}
