import { z } from 'zod';

import { SERVICE_REQUEST_PRIORITIES } from '@/constants/enums.const';

const optionalText = z.preprocess(
  value => (value === '' || value == null ? undefined : value),
  z.string().trim().max(2000, 'Description is too long.').optional()
);

/*
  What an owner submits to book a service. The vehicle and the center are ids the owner picked from their
  own lists; the service verifies the vehicle is theirs and the center is one an admin has vetted before
  it writes anything — the form cannot vouch for either. Priority defaults to NORMAL.
*/
export const BookingCreateSchema = z.object({
  vehicleId: z.string().min(1, 'Choose a vehicle.'),
  serviceCenterId: z.string().min(1, 'Choose a service center.'),
  serviceType: z.string().trim().min(1, 'Enter the service type.').max(120, 'Service type is too long.'),
  description: optionalText,
  priority: z.enum(Object.values(SERVICE_REQUEST_PRIORITIES)).default(SERVICE_REQUEST_PRIORITIES.NORMAL),
  preferredDate: z.coerce.date(),
});

export type BookingCreateOutput = z.output<typeof BookingCreateSchema>;
