'use client';

import { useActionState } from 'react';

import { Field, SubmitButton } from '@/components/auth/field';

import { updateCenterProfileAction, type FormState } from './actions';

import type { ServiceCenterProfileDto } from '@/types';

const initial: FormState = { error: null };

type CenterProfileFormProps = {
  profile: ServiceCenterProfileDto;
};

export function CenterProfileForm({ profile }: CenterProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateCenterProfileAction, initial);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <Field label="Center name" name="centerName" defaultValue={profile.centerName} required />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" name="city" defaultValue={profile.city} required />
        <Field label="Phone" name="phone" defaultValue={profile.phone} required />
      </div>

      <Field label="Address" name="address" defaultValue={profile.address} required />
      <Field label="Services offered (comma separated)" name="servicesOffered" defaultValue={profile.servicesOffered.join(', ')} />

      {state.error && <p className="text-destructive text-sm">{state.error}</p>}

      <SubmitButton pending={pending}>{pending ? 'Saving…' : 'Save profile'}</SubmitButton>
    </form>
  );
}
