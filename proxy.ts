import { NextResponse } from 'next/server';

/*
  Next.js 16 calls this file `proxy.ts` (it was `middleware.ts` before). Only one is allowed, and it
  is the request perimeter — it answers "is there a session"; the page answers "is it the right one",
  and every service re-checks besides. A guard that only ran here would be a guard a Server Action
  could walk around.

  Step 0 ships a pass-through stub. The same-origin refusal for `/api` (step 4) and the session gate
  for `PROTECTED_SEGMENTS` (step 5) arrive with the routes they protect, so neither the guard nor its
  route list has to be invented later.
*/
export function proxy() {
  return NextResponse.next();
}

export const config = {
  // `api` is deliberately not excluded — the same-origin refusal cannot run on a path the matcher
  // never hands over. Next internals and anything with a file extension stay out.
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
