'use client';

import { useActionState } from 'react';

import { FUEL_TYPES, TRANSMISSIONS } from '@/constants/enums.const';

import { Field, SubmitButton } from '@/components/auth/field';

import { createVehicleAction, type FormState } from './actions';

const initial: FormState = { error: null };

const selectClassName =
  'w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring';

const label = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

export function VehicleForm() {
  const [state, formAction, pending] = useActionState(createVehicleAction, initial);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Make" name="make" required />
        <Field label="Model" name="model" required />
        <Field label="Year" name="year" type="number" inputMode="numeric" required />
        <Field label="Color (optional)" name="color" />
        <Field label="VIN" name="vin" required />
        <Field label="Registration number" name="registrationNo" required />
        <Field label="Current mileage" name="currentMileage" type="number" inputMode="numeric" required />
        <Field label="Purchase date (optional)" name="purchaseDate" type="date" />

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Fuel type
          <select name="fuelType" required className={selectClassName} defaultValue={FUEL_TYPES.PETROL}>
            {Object.values(FUEL_TYPES).map(value => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Transmission
          <select name="transmission" required className={selectClassName} defaultValue={TRANSMISSIONS.MANUAL}>
            {Object.values(TRANSMISSIONS).map(value => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {state.error && <p className="text-destructive text-sm">{state.error}</p>}

      <SubmitButton pending={pending}>{pending ? 'Saving…' : 'Add vehicle'}</SubmitButton>
    </form>
  );
}
