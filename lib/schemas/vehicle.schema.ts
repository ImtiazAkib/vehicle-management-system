import { z } from 'zod';

import { FUEL_TYPES, TRANSMISSIONS } from '@/constants/enums.const';

const optionalDate = z.preprocess(value => (value === '' || value == null ? undefined : value), z.coerce.date().optional());

/*
  What an owner types when they register a vehicle. `vin` and `registrationNo` are uppercased so a search
  and the unique index see one canonical form. `currentMileage` is the integer maintenance reads against.
*/
export const VehicleCreateSchema = z.object({
  make: z.string().trim().min(1, 'Enter the make.').max(60, 'Make is too long.'),
  model: z.string().trim().min(1, 'Enter the model.').max(60, 'Model is too long.'),
  year: z.coerce.number().int('Enter a valid year.').min(1900, 'Enter a valid year.').max(2100, 'Enter a valid year.'),
  vin: z.string().trim().toUpperCase().min(1, 'Enter the VIN.').max(32, 'VIN is too long.'),
  registrationNo: z.string().trim().toUpperCase().min(1, 'Enter the registration number.').max(32, 'Registration number is too long.'),
  color: z.string().trim().max(40, 'Color is too long.').optional(),
  fuelType: z.enum(Object.values(FUEL_TYPES)),
  transmission: z.enum(Object.values(TRANSMISSIONS)),
  currentMileage: z.coerce.number().int('Enter a valid mileage.').min(0, 'Mileage cannot be negative.'),
  purchaseDate: optionalDate,
});

export type VehicleCreateOutput = z.output<typeof VehicleCreateSchema>;
