import type { ReactNode } from 'react';

import Link from 'next/link';

import { APP_DATA } from '@/constants/app-data.const';
import { ROUTES } from '@/constants/routes.const';

type AuthLayoutProps = {
  children: ReactNode;
};

/*
  Its own group with neither the marketing header nor the dashboard shell: somebody signing in has one
  thing to do, and the navigation they would get from either is either irrelevant or not theirs yet. The
  brand stays, so the page is clearly this platform's.
*/
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-border border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4">
          <Link href={ROUTES.HOME.HREF} className="font-heading text-lg font-semibold tracking-tight">
            {APP_DATA.SHORT_NAME}
          </Link>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col justify-center">
        {children}
      </main>
    </div>
  );
}
