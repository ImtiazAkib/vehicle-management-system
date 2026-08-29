import type { Metadata } from 'next';

import { AuthCard, ResendVerificationForm } from '@/components/auth';

export const metadata: Metadata = {
  title: 'Resend the link',
  robots: { index: false, follow: false },
};

export default function ResendVerificationPage() {
  return (
    <AuthCard title="Resend the confirmation link" description="Enter the address you registered with.">
      <ResendVerificationForm />
    </AuthCard>
  );
}
