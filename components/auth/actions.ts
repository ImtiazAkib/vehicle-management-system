'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { env } from '@/env/server';

import { RATE_LIMIT } from '@/constants/rate-limit.const';
import { ROLE_HOME, ROUTES } from '@/constants/routes.const';

import { setSessionCookie } from '@/lib/auth';
import { ForgotPasswordSchema, RegistrationSchema, ResetPasswordSchema, SignInSchema } from '@/lib/schemas';
import { AuthService } from '@/lib/services';
import { consumeRateLimit, resetRateLimit } from '@/lib/services/rate-limit.guard';
import { resolveCallerKey } from '@/lib/utils';

const authService = new AuthService();

/** The shape every auth form's `useActionState` carries: a message on failure, a `done` flag on a neutral success. */
export type FormState = {
  error: string | null;
  done?: boolean;
};

const get = (formData: FormData, key: string): string | undefined => {
  const value = formData.get(key);

  return typeof value === 'string' ? value : undefined;
};

async function resolveCaller(): Promise<string> {
  const requestHeaders = await headers();

  return resolveCallerKey(requestHeaders, env.TRUSTED_PROXY);
}

/** Verify credentials and, on success, set the session cookie and land the visitor on their role home. */
export async function signInAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = SignInSchema.safeParse({ identifier: get(formData, 'identifier'), password: get(formData, 'password') });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Enter your email and password.' };
  }

  const { identifier, password } = parsed.data;

  const withinIdentifier = await consumeRateLimit('sign-in', identifier, RATE_LIMIT.SIGN_IN);
  const withinCaller = env.TRUSTED_PROXY ? await consumeRateLimit('sign-in-caller', await resolveCaller(), RATE_LIMIT.SIGN_IN_CALLER) : true;

  if (!withinIdentifier || !withinCaller) {
    return { error: 'Too many attempts. Wait a moment and try again.' };
  }

  const result = await authService.verifyCredentials(identifier, password);

  if (!result.success || !result.result) {
    return { error: result.errors[0]?.error ?? 'Sign-in failed.' };
  }

  const account = result.result;

  await resetRateLimit('sign-in', identifier);
  await setSessionCookie({
    userId: account.userId,
    email: account.email,
    name: account.name,
    role: account.role,
    isApproved: account.isApproved,
  });

  redirect(ROLE_HOME[account.role]);
}

/** Register one of the three business roles; the service hard-codes the account's state. Neutral either way. */
export async function registerAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = RegistrationSchema.safeParse({
    role: get(formData, 'role'),
    name: get(formData, 'name'),
    email: get(formData, 'email'),
    password: get(formData, 'password'),
    phone: get(formData, 'phone') || undefined,
    centerName: get(formData, 'centerName'),
    businessName: get(formData, 'businessName'),
    address: get(formData, 'address'),
    city: get(formData, 'city'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' };
  }

  const within = await consumeRateLimit('register', await resolveCaller(), RATE_LIMIT.REGISTER);

  if (!within) {
    return { error: 'Too many attempts. Wait a moment and try again.' };
  }

  const result = await authService.register(parsed.data);

  if (!result.success) {
    return { error: result.errors[0]?.error ?? 'Registration failed.' };
  }

  redirect(ROUTES.REGISTRATION_RECEIVED.HREF);
}

/** Resend a verification link — neutral, whatever is true of the address. */
export async function resendVerificationAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const email = (get(formData, 'email') ?? '').trim();

  if (!email) {
    return { error: 'Enter your email address.' };
  }

  await consumeRateLimit('resend', await resolveCaller(), RATE_LIMIT.RESEND);
  await authService.resendVerification(email);

  redirect(ROUTES.REGISTRATION_RECEIVED.HREF);
}

/** Ask for a password-reset link — always answers the same neutral success. */
export async function requestPasswordResetAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = ForgotPasswordSchema.safeParse({ email: get(formData, 'email') });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Enter your email address.' };
  }

  await consumeRateLimit('password-reset', await resolveCaller(), RATE_LIMIT.PASSWORD_RESET);
  await authService.issuePasswordReset(parsed.data.email);

  return { error: null, done: true };
}

/** Set a new password from a reset link; on success, off to sign in. */
export async function resetPasswordAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = ResetPasswordSchema.safeParse({ token: get(formData, 'token'), password: get(formData, 'password') });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Enter a new password.' };
  }

  const result = await authService.resetPassword(parsed.data.token, parsed.data.password);

  if (!result.success) {
    return { error: result.errors[0]?.error ?? 'Could not reset your password.' };
  }

  redirect(ROUTES.SIGN_IN.HREF);
}
