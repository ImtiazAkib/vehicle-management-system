'use client';

import { useActionState } from 'react';

import { registerAction, type FormState } from './actions';
import { Field, SubmitButton } from './field';

const initial: FormState = { error: null };

type RegisterFormProps = {
  role: 'owner' | 'service-center' | 'supplier';
};

export function RegisterForm({ role }: RegisterFormProps) {
  const [state, formAction, pending] = useActionState(registerAction, initial);
  const isBusiness = role !== 'owner';

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="role" value={role} />

      <Field label="Your name" name="name" autoComplete="name" required />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field label="Password" name="password" type="password" autoComplete="new-password" required />
      <Field label={isBusiness ? 'Phone' : 'Phone (optional)'} name="phone" type="tel" autoComplete="tel" required={isBusiness} />

      {role === 'service-center' && <Field label="Service center name" name="centerName" required />}
      {role === 'supplier' && <Field label="Business name" name="businessName" required />}
      {isBusiness && <Field label="Address" name="address" required />}
      {isBusiness && <Field label="City" name="city" required />}

      {state.error && <p className="text-destructive text-sm">{state.error}</p>}

      <SubmitButton pending={pending}>{pending ? 'Creating…' : 'Create account'}</SubmitButton>
    </form>
  );
}
