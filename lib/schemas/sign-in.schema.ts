import { z } from 'zod';

/*
  Everybody signs in with their email address. The address is deliberately NOT validated as an email here:
  a typo should be refused by "that email and password do not match" — the same answer a wrong password
  gets — rather than by a format error that would tell a visitor whether a string is even shaped like one
  of our addresses. The password is only checked for presence; strength is enforced where it is set.
*/
export const SignInSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

export type SignInOutput = z.output<typeof SignInSchema>;
