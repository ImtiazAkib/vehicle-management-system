const createErrorDefinition = (code: number, message: string) => ({ CODE: code, MESSAGE: message }) as const;

/** Scheduling — database layer (13xxx). */
export const SCHEDULING_DATABASE = {
  READ_FAILED: createErrorDefinition(13300, 'Could not load schedules. Try again.'),
  WRITE_FAILED: createErrorDefinition(13301, 'Could not save the schedule. Try again.'),
} as const;

/** Scheduling — validation layer (23xxx). */
export const SCHEDULING_VALIDATION = {
  SCHEDULE_NOT_FOUND: createErrorDefinition(23300, 'Schedule not found.'),
  VEHICLE_NOT_FOUND: createErrorDefinition(23301, 'That vehicle was not found.'),
} as const;
