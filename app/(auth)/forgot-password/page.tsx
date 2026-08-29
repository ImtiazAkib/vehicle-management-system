import type { Metadata } from 'next';

import Link from 'next/link';

import { ROUTES } from '@/constants/routes.const';

import { AuthCard, ForgotPasswordForm } from '@/components/auth';

export const metadata: Metadata = {
  title: 'Reset your password',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we will send a link to set a new one."
      footer={
        <p className="text-muted-foreground text-center text-sm">
          <Link href={ROUTES.SIGN_IN.HREF} className="text-foreground font-medium underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      }>
      <ForgotPasswordForm />
    </AuthCard>
  );
}
