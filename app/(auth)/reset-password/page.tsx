import type { Metadata } from 'next';

import Link from 'next/link';

import { ROUTES } from '@/constants/routes.const';

import { AuthCard, ResetPasswordForm } from '@/components/auth';

export const metadata: Metadata = {
  title: 'Set a new password',
  robots: { index: false, follow: false },
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthCard title="This link is incomplete" description="It is missing its token.">
        <p className="text-muted-foreground text-sm">Request a fresh reset link and try again.</p>
        <p className="mt-4 text-sm">
          <Link href={ROUTES.FORGOT_PASSWORD.HREF} className="text-foreground font-medium underline-offset-4 hover:underline">
            Request a new link
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password" description="Choose a new password for your account.">
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
