import type { Metadata } from 'next';

import { APP_DATA } from '@/constants/app-data.const';

/*
  A token-free public page, kept out of the index. The real sign-in form — credentials, the anti-enumeration
  refusal and the `next` redirect — lands in step 6.
*/
export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <main>
      <h1>Sign in to {APP_DATA.SHORT_NAME}</h1>
      <p>The sign-in form arrives in step 6.</p>
    </main>
  );
}
