import type { Metadata } from 'next';

import Link from 'next/link';

import { ROUTES } from '@/constants/routes.const';

import { AuthCard, RegisterForm } from '@/components/auth';

export const metadata: Metadata = {
  title: 'Register as a vehicle owner',
  robots: { index: false, follow: false },
};

export default function RegisterOwnerPage() {
  return (
    <AuthCard
      title="Register as a vehicle owner"
      description="You can sign in as soon as you confirm your email address."
      footer={
        <p className="text-muted-foreground text-center text-sm">
          <Link href={ROUTES.REGISTER.HREF} className="text-foreground font-medium underline-offset-4 hover:underline">
            Register as something else
          </Link>
        </p>
      }>
      <RegisterForm role="owner" />
    </AuthCard>
  );
}
