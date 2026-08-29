import { z } from 'zod';

import { accountFields } from './account-fields.schema';

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'This link is missing its token.'),
  password: accountFields.password,
});

export type ResetPasswordOutput = z.output<typeof ResetPasswordSchema>;
