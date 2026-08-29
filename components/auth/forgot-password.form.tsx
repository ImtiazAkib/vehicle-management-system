'use client';

import { useActionState } from 'react';

import { requestPasswordResetAction, type FormState } from './actions';
import { Field, SubmitButton } from './field';

const initial: FormState = { error: null };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initial);

  if (state.done) {
    return <p className="text-muted-foreground text-sm">If that address has an account, a reset link is on its way. Check your inbox.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Email" name="email" type="email" autoComplete="email" required />

      {state.error && <p className="text-destructive text-sm">{state.error}</p>}

      <SubmitButton pending={pending}>{pending ? 'Sending…' : 'Send reset link'}</SubmitButton>
    </form>
  );
}
