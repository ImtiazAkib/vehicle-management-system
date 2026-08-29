import { z } from 'zod';

const optionalInt = z.preprocess(value => (value === '' || value == null ? undefined : value), z.coerce.number().int().min(0).optional());

/*
  A schedule is driven by time (`intervalMonths` → `nextDueDate`) and/or mileage (`intervalMileage` →
  `nextDueMileage`). At least the due date is required; the mileage side is optional, for a schedule that
  only tracks the calendar.
*/
export const MaintenanceScheduleCreateSchema = z.object({
  vehicleId: z.string().min(1, 'Choose a vehicle.'),
  serviceType: z.string().trim().min(1, 'Enter the service type.').max(120, 'Service type is too long.'),
  intervalMonths: optionalInt,
  intervalMileage: optionalInt,
  nextDueDate: z.coerce.date(),
  nextDueMileage: optionalInt,
});

export type MaintenanceScheduleCreateOutput = z.output<typeof MaintenanceScheduleCreateSchema>;
