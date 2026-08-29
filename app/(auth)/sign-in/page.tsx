import type { Metadata } from 'next';

import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ROLE_HOME, ROUTES } from '@/constants/routes.const';

import { getSessionUser } from '@/lib/auth';

import { AuthCard, SignInForm } from '@/components/auth';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

export default async function SignInPage() {
  // Public by definition: the question is not "may you be here" but "are you already in". Nobody signs in twice.
  const sessionUser = await getSessionUser();

  if (sessionUser) {
    redirect(ROLE_HOME[sessionUser.role]);
  }

  return (
    <AuthCard
      title="Sign in"
      description="Use the email address your account was created with."
      footer={
        <p className="text-muted-foreground text-center text-sm">
          New here?{' '}
          <Link href={ROUTES.REGISTER.HREF} className="text-foreground font-medium underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      }>
      <SignInForm />
      <p className="mt-4 text-center text-sm">
        <Link href={ROUTES.FORGOT_PASSWORD.HREF} className="text-muted-foreground underline-offset-4 hover:underline">
          Forgot your password?
        </Link>
      </p>
    </AuthCard>
  );
}
