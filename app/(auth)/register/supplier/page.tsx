import type { Metadata } from 'next';

import Link from 'next/link';

import { ROUTES } from '@/constants/routes.const';

import { AuthCard, RegisterForm } from '@/components/auth';

export const metadata: Metadata = {
  title: 'Register as a supplier',
  robots: { index: false, follow: false },
};

export default function RegisterSupplierPage() {
  return (
    <AuthCard
      title="Register as a supplier"
      description="After you confirm your email you can sign in; an administrator verifies your business before you can list products."
      footer={
        <p className="text-muted-foreground text-center text-sm">
          <Link href={ROUTES.REGISTER.HREF} className="text-foreground font-medium underline-offset-4 hover:underline">
            Register as something else
          </Link>
        </p>
      }>
      <RegisterForm role="supplier" />
    </AuthCard>
  );
}
