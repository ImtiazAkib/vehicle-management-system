/*
  `@/lib/utils` resolves here, so `import { cn } from '@/lib/utils'` keeps working and the shadcn alias in
  `components.json` stays correct.

  Everything re-exported here must be safe in a client bundle. Later utils that touch server-only or heavy
  modules import them with `import type`, which the compiler erases. Only the primitives that exist at
  step 1 are wired now; each later util joins this barrel with the step that adds it.
*/
export * from './class-name.utils';
export * from './money.utils';
