const createErrorDefinition = (code: number, message: string) => ({ CODE: code, MESSAGE: message }) as const;

/** Bookings — database layer (14xxx). */
export const BOOKINGS_DATABASE = {
  READ_FAILED: createErrorDefinition(14400, 'Could not load bookings. Try again.'),
  WRITE_FAILED: createErrorDefinition(14401, 'Could not save the booking. Try again.'),
} as const;

/** Bookings — validation layer (24xxx). */
export const BOOKINGS_VALIDATION = {
  REQUEST_NOT_FOUND: createErrorDefinition(24400, 'Booking not found.'),
  VEHICLE_NOT_FOUND: createErrorDefinition(24401, 'That vehicle was not found.'),
  CENTER_NOT_FOUND: createErrorDefinition(24402, 'That service center was not found.'),
} as const;

/** Bookings — business layer (34xxx). */
export const BOOKINGS_BUSINESS = {
  CENTER_NOT_VERIFIED: createErrorDefinition(34400, 'That service center has not been verified yet.'),
  ILLEGAL_TRANSITION: createErrorDefinition(34401, 'That status change is not allowed for this booking.'),
  NOT_ASSIGNED_CENTER: createErrorDefinition(34402, 'That booking is not assigned to your center.'),
  NOT_OWNER: createErrorDefinition(34403, 'That booking is not yours.'),
} as const;
