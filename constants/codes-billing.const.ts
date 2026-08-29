const createErrorDefinition = (code: number, message: string) => ({ CODE: code, MESSAGE: message }) as const;

/*
  Billing — feature digit 7. This step issues the SERVICE invoice; step 13 adds the payment side that
  settles it, extending these same namespaces.
*/

/** Billing — database layer (17xxx). */
export const BILLING_DATABASE = {
  READ_FAILED: createErrorDefinition(17700, 'Could not load invoices. Try again.'),
  WRITE_FAILED: createErrorDefinition(17701, 'Could not issue the invoice. Try again.'),
} as const;

/** Billing — validation layer (27xxx). */
export const BILLING_VALIDATION = {
  REQUEST_NOT_FOUND: createErrorDefinition(27700, 'Booking not found.'),
  INVOICE_NOT_FOUND: createErrorDefinition(27701, 'Invoice not found.'),
} as const;

/** Billing — business layer (37xxx). */
export const BILLING_BUSINESS = {
  NOT_ASSIGNED_CENTER: createErrorDefinition(37700, 'That booking is not assigned to your center.'),
  BOOKING_NOT_COMPLETED: createErrorDefinition(37701, 'You can only invoice a completed booking.'),
  ALREADY_INVOICED: createErrorDefinition(37702, 'This booking has already been invoiced.'),
} as const;
