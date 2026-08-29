import type { Metadata } from 'next';

import Link from 'next/link';

import { ROUTES } from '@/constants/routes.const';

import { AuthService } from '@/lib/services';

import { AuthCard } from '@/components/auth';

export const metadata: Metadata = {
  title: 'Verify your email',
  robots: { index: false, follow: false },
};

const authService = new AuthService();

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;
  const result = token ? await authService.verifyEmail(token) : null;
  const verified = result?.success ?? false;

  if (verified) {
    return (
      <AuthCard title="Email confirmed" description="Your address is confirmed.">
        <p className="text-muted-foreground text-sm">You can sign in now.</p>
        <p className="mt-4 text-sm">
          <Link href={ROUTES.SIGN_IN.HREF} className="text-foreground font-medium underline-offset-4 hover:underline">
            Go to sign in
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="This link did not work" description="It may have already been used or expired.">
      <p className="text-muted-foreground text-sm">{result?.errors[0]?.error ?? 'This link is invalid or has expired.'}</p>
      <p className="mt-4 text-sm">
        <Link href={ROUTES.RESEND_VERIFICATION.HREF} className="text-foreground font-medium underline-offset-4 hover:underline">
          Request a new link
        </Link>
      </p>
    </AuthCard>
  );
}
