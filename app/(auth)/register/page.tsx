import type { Metadata } from 'next';

import Link from 'next/link';

import { ROUTES } from '@/constants/routes.const';

import { AuthCard } from '@/components/auth';

export const metadata: Metadata = {
  title: 'Create an account',
  robots: { index: false, follow: false },
};

const CHOICES = [
  { href: ROUTES.REGISTER_OWNER.HREF, title: 'Vehicle owner', summary: 'Manage your vehicles, book services and order supplies.' },
  { href: ROUTES.REGISTER_SERVICE_CENTER.HREF, title: 'Service center', summary: 'Receive service requests and record the work you do.' },
  { href: ROUTES.REGISTER_SUPPLIER.HREF, title: 'Supplier', summary: 'List utility supplies and fulfill owner orders.' },
];

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create an account"
      description="Choose the kind of account you need."
      footer={
        <p className="text-muted-foreground text-center text-sm">
          Already have one?{' '}
          <Link href={ROUTES.SIGN_IN.HREF} className="text-foreground font-medium underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      }>
      <div className="flex flex-col gap-2">
        {CHOICES.map(choice => (
          <Link key={choice.href} href={choice.href} className="border-border hover:bg-muted flex flex-col gap-0.5 rounded-md border p-3">
            <span className="text-sm font-semibold">{choice.title}</span>
            <span className="text-muted-foreground text-sm">{choice.summary}</span>
          </Link>
        ))}
      </div>
    </AuthCard>
  );
}
