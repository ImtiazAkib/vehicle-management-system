'use client';

import { useActionState } from 'react';

import { Field, SubmitButton } from '@/components/auth/field';

import { createScheduleAction, type FormState } from './actions';

import type { VehicleDto } from '@/types';

const initial: FormState = { error: null };

const selectClassName =
  'w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring';

type ScheduleFormProps = {
  vehicles: VehicleDto[];
};

export function ScheduleForm({ vehicles }: ScheduleFormProps) {
  const [state, formAction, pending] = useActionState(createScheduleAction, initial);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Vehicle
        <select name="vehicleId" required className={selectClassName} defaultValue={vehicles[0]?.vehicleId}>
          {vehicles.map(vehicle => (
            <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </option>
          ))}
        </select>
      </label>

      <Field label="Service type" name="serviceType" placeholder="Oil change, tire rotation…" required />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Next due date" name="nextDueDate" type="date" required />
        <Field label="Next due mileage (optional)" name="nextDueMileage" type="number" inputMode="numeric" />
        <Field label="Interval months (optional)" name="intervalMonths" type="number" inputMode="numeric" />
        <Field label="Interval mileage (optional)" name="intervalMileage" type="number" inputMode="numeric" />
      </div>

      {state.error && <p className="text-destructive text-sm">{state.error}</p>}

      <SubmitButton pending={pending}>{pending ? 'Saving…' : 'Add schedule'}</SubmitButton>
    </form>
  );
}
