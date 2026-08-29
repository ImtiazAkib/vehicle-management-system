const createErrorDefinition = (code: number, message: string) => ({ CODE: code, MESSAGE: message }) as const;

/** Users/accounts — database layer (11xxx). */
export const USERS_DATABASE = {
  UPDATE_FAILED: createErrorDefinition(11100, 'Could not update the account. Try again.'),
} as const;

/** Users/accounts — validation layer (21xxx). */
export const USERS_VALIDATION = {
  INVALID_OR_EXPIRED_TOKEN: createErrorDefinition(21100, 'This link is invalid or has expired. Request a new one.'),
} as const;

/** Users/accounts — business layer (31xxx). */
export const USERS_BUSINESS = {
  REGISTRATION_FAILED: createErrorDefinition(31100, 'We could not create your account. Try again.'),
  ACCOUNT_NOT_FOUND: createErrorDefinition(31101, 'Account not found.'),
  ALREADY_VERIFIED: createErrorDefinition(31102, 'This account is already verified.'),
  UPDATE_FAILED: createErrorDefinition(31103, 'Could not apply the change. Try again.'),
} as const;

/** Users/accounts — auth layer (51xxx). */
export const USERS_AUTH = {
  INVALID_CREDENTIALS: createErrorDefinition(51100, 'That email and password do not match.'),
  ACCOUNT_DEACTIVATED: createErrorDefinition(51101, 'This account has been deactivated. Contact an administrator.'),
  EMAIL_NOT_VERIFIED: createErrorDefinition(51102, 'Confirm your email address to sign in. Check your inbox for the link.'),
  ACCOUNT_NOT_APPROVED: createErrorDefinition(51103, 'This account is awaiting approval.'),
  SIGN_IN_FAILED: createErrorDefinition(51104, 'Sign-in failed. Try again in a moment.'),
} as const;
