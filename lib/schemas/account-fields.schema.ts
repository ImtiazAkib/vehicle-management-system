import { z } from 'zod';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/*
  The shared field validators, so registration and every later account form agree on what a name, an
  email or a password is — the password's eight-character floor included, enforced where passwords are
  set rather than where they are used.
*/
export const accountFields = {
  name: z.string().trim().min(1, 'Enter your name.').max(120, 'Name is too long.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Enter your email address.')
    .max(255, 'Email is too long.')
    .regex(EMAIL_PATTERN, 'Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.').max(128, 'Password is too long.'),
};
