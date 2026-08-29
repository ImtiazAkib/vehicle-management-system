import type { Metadata } from 'next';

/*
  The 403 an authenticated visitor lands on when they reach an area their role does not own — a refusal,
  not a missing session, so it is a page rather than a bounce to sign-in. Kept out of the index. The full
  screen, with a link back to the visitor's own home, lands with the dashboard shell in step 5.
*/
export const metadata: Metadata = {
  title: 'Not allowed',
  robots: { index: false, follow: false },
};

export default function UnauthorizedPage() {
  return (
    <main>
      <h1>Not allowed</h1>
      <p>Your role does not allow this area.</p>
    </main>
  );
}
