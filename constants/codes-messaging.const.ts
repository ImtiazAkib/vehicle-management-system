const createErrorDefinition = (code: number, message: string) => ({ CODE: code, MESSAGE: message }) as const;

/** Messaging — database layer (18xxx). */
export const MESSAGING_DATABASE = {
  READ_FAILED: createErrorDefinition(18800, 'Could not load messages. Try again.'),
  WRITE_FAILED: createErrorDefinition(18801, 'Could not send the message. Try again.'),
} as const;

/** Messaging — validation layer (28xxx). */
export const MESSAGING_VALIDATION = {
  CONVERSATION_NOT_FOUND: createErrorDefinition(28800, 'Conversation not found.'),
  BOOKING_NOT_FOUND: createErrorDefinition(28801, 'That booking was not found.'),
} as const;

/** Messaging — business layer (38xxx). */
export const MESSAGING_BUSINESS = {
  FORBIDDEN: createErrorDefinition(38800, 'You are not a participant in this conversation.'),
} as const;
