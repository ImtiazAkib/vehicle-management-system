import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

/*
  A thin config: the unit tests here are pure functions — token signing, schema parsing, money and
  schedule-due math, the booking/order transition guards — so they run in the Node environment with
  no jsdom and no setup file.

  `@/*` resolves to the project root, matching the `paths` alias in `tsconfig.json`, so a test imports
  `@/lib/...` exactly as the app does. The `env` values are dummies: importing anything that reaches
  `@/env/server` (step 1) triggers its schema validation, and a throwaway `AUTH_SECRET` long enough to
  clear the 32-character floor lets the session tests sign and verify a token without a real one.
*/
export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    env: {
      MONGODB_URI: 'mongodb://127.0.0.1:27017/vehicle-utilities-test',
      AUTH_SECRET: 'test-only-auth-secret-at-least-32-characters-long',
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
});
