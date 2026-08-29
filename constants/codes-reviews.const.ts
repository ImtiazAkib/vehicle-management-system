const createErrorDefinition = (code: number, message: string) => ({ CODE: code, MESSAGE: message }) as const;

/** Reviews — database layer (19xxx). */
export const REVIEWS_DATABASE = {
  READ_FAILED: createErrorDefinition(19900, 'Could not load reviews. Try again.'),
  WRITE_FAILED: createErrorDefinition(19901, 'Could not save your review. Try again.'),
} as const;

/** Reviews — validation layer (29xxx). */
export const REVIEWS_VALIDATION = {
  TARGET_NOT_FOUND: createErrorDefinition(29900, 'That target was not found.'),
} as const;

/** Reviews — business layer (39xxx). */
export const REVIEWS_BUSINESS = {
  NOT_TRANSACTED: createErrorDefinition(39900, 'You can only review something you have transacted with.'),
} as const;
