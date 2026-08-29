'use client';

import { useActionState } from 'react';

import { signInAction, type FormState } from './actions';
import { Field, SubmitButton } from './field';

const initial: FormState = { error: null };

export function SignInForm() {
  const [state, formAction, pending] = useActionState(signInAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Email" name="identifier" type="email" autoComplete="email" required />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />

      {state.error && <p className="text-destructive text-sm">{state.error}</p>}

      <SubmitButton pending={pending}>{pending ? 'Signing in…' : 'Sign in'}</SubmitButton>
    </form>
  );
}
