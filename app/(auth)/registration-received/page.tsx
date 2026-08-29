import type { Metadata } from 'next';

import Link from 'next/link';

import { ROUTES } from '@/constants/routes.const';

import { AuthCard } from '@/components/auth';

export const metadata: Metadata = {
  title: 'Check your inbox',
  robots: { index: false, follow: false },
};

export default function RegistrationReceivedPage() {
  return (
    <AuthCard title="Check your inbox" description="Almost there.">
      <p className="text-muted-foreground text-sm">
        If the details were new, a confirmation link is on its way. Follow it to finish creating your account, then sign in.
      </p>
      <p className="mt-4 text-sm">
        <Link href={ROUTES.RESEND_VERIFICATION.HREF} className="text-muted-foreground underline-offset-4 hover:underline">
          Did not get it? Resend the link
        </Link>
      </p>
    </AuthCard>
  );
}
