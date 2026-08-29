import { z } from 'zod';

/*
  Only presence is checked, not email shape — the request page answers the same "check your inbox"
  whatever the address, so a format error would be the one way to tell whether a string is shaped like one
  of our addresses.
*/
export const ForgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().min(3, 'Enter your email address.').max(255, 'Email is too long.'),
});

export type ForgotPasswordOutput = z.output<typeof ForgotPasswordSchema>;
