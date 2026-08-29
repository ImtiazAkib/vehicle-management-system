const createErrorDefinition = (code: number, message: string) => ({ CODE: code, MESSAGE: message }) as const;

/** Vehicles — database layer (12xxx). */
export const VEHICLES_DATABASE = {
  READ_FAILED: createErrorDefinition(12200, 'Could not load vehicles. Try again.'),
  WRITE_FAILED: createErrorDefinition(12201, 'Could not save the vehicle. Try again.'),
} as const;

/** Vehicles — validation layer (22xxx). */
export const VEHICLES_VALIDATION = {
  NOT_FOUND: createErrorDefinition(22200, 'Vehicle not found.'),
} as const;

/** Vehicles — business layer (32xxx). */
export const VEHICLES_BUSINESS = {
  DUPLICATE_VIN: createErrorDefinition(32200, 'A vehicle with this VIN already exists.'),
  DUPLICATE_REGISTRATION: createErrorDefinition(32201, 'A vehicle with this registration number already exists.'),
} as const;
