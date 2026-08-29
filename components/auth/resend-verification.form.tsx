'use client';

import { useActionState } from 'react';

import { resendVerificationAction, type FormState } from './actions';
import { Field, SubmitButton } from './field';

const initial: FormState = { error: null };

export function ResendVerificationForm() {
  const [state, formAction, pending] = useActionState(resendVerificationAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Email" name="email" type="email" autoComplete="email" required />

      {state.error && <p className="text-destructive text-sm">{state.error}</p>}

      <SubmitButton pending={pending}>{pending ? 'Sending…' : 'Resend link'}</SubmitButton>
    </form>
  );
}
