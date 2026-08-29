import type { Metadata } from 'next';

import Link from 'next/link';

import { ROUTES } from '@/constants/routes.const';

import { AuthCard, RegisterForm } from '@/components/auth';

export const metadata: Metadata = {
  title: 'Register a service center',
  robots: { index: false, follow: false },
};

export default function RegisterServiceCenterPage() {
  return (
    <AuthCard
      title="Register a service center"
      description="After you confirm your email you can sign in; an administrator verifies your center before it can take bookings."
      footer={
        <p className="text-muted-foreground text-center text-sm">
          <Link href={ROUTES.REGISTER.HREF} className="text-foreground font-medium underline-offset-4 hover:underline">
            Register as something else
          </Link>
        </p>
      }>
      <RegisterForm role="service-center" />
    </AuthCard>
  );
}
