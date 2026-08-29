'use client';

import { useActionState } from 'react';

import { SERVICE_REQUEST_PRIORITIES } from '@/constants/enums.const';

import { Field, SubmitButton } from '@/components/auth/field';

import { createBookingAction, type FormState } from './actions';

import type { ServiceCenterProfileDto, VehicleDto } from '@/types';

const initial: FormState = { error: null };

const selectClassName =
  'w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring';

const priorityLabel = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

type BookingCreateFormProps = {
  vehicles: VehicleDto[];
  centers: ServiceCenterProfileDto[];
};

export function BookingCreateForm({ vehicles, centers }: BookingCreateFormProps) {
  const [state, formAction, pending] = useActionState(createBookingAction, initial);

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

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Service center
        <select name="serviceCenterId" required className={selectClassName} defaultValue={centers[0]?.serviceCenterId}>
          {centers.map(center => (
            <option key={center.serviceCenterId} value={center.serviceCenterId}>
              {center.centerName} — {center.city}
            </option>
          ))}
        </select>
      </label>

      <Field label="Service type" name="serviceType" placeholder="Oil change, brake inspection…" required />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Preferred date" name="preferredDate" type="date" required />

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Priority
          <select name="priority" required className={selectClassName} defaultValue={SERVICE_REQUEST_PRIORITIES.NORMAL}>
            {Object.values(SERVICE_REQUEST_PRIORITIES).map(value => (
              <option key={value} value={value}>
                {priorityLabel(value)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Notes (optional)
        <textarea
          name="description"
          rows={3}
          className="border-input bg-card text-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2"
        />
      </label>

      {state.error && <p className="text-destructive text-sm">{state.error}</p>}

      <SubmitButton pending={pending}>{pending ? 'Booking…' : 'Book service'}</SubmitButton>
    </form>
  );
}
