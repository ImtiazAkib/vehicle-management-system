'use client';

import { useActionState } from 'react';

import { Field, SubmitButton } from '@/components/auth/field';

import { updateSupplierProfileAction, type FormState } from './actions';

import type { SupplierProfileDto } from '@/types';

const initial: FormState = { error: null };

type SupplierProfileFormProps = {
  profile: SupplierProfileDto;
};

export function SupplierProfileForm({ profile }: SupplierProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateSupplierProfileAction, initial);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <Field label="Business name" name="businessName" defaultValue={profile.businessName} required />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" name="city" defaultValue={profile.city} required />
        <Field label="Phone" name="phone" defaultValue={profile.phone} required />
      </div>

      <Field label="Address" name="address" defaultValue={profile.address} required />

      {state.error && <p className="text-destructive text-sm">{state.error}</p>}

      <SubmitButton pending={pending}>{pending ? 'Saving…' : 'Save profile'}</SubmitButton>
    </form>
  );
}
