import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/*
  Server-side environment. Imported at the top of `next.config.ts`, so an invalid or missing variable
  fails the build instead of surfacing as a runtime error on some request nobody made yet.

  Each secret becomes required in the step that first reads it: `MONGODB_URI` with the data model
  (step 3) and `AUTH_SECRET` with the session (step 4) — both required now. A present-but-too-short
  secret always fails, so the guard is real the moment a value is supplied.
*/

/*
  For a variable that has a default, an unset one and one that is present but empty mean the same
  thing: use the default. `.default()` only fires on `undefined`, so a line blanked in `.env.local`
  (which hands zod `''`) would otherwise fail a `z.url()` or a number coercion instead of falling
  back. Applied only to the defaulted and optional variables.

  @param schema - The schema to apply once a real value is present.
  @returns The same schema, with an empty string read as absence.
*/
function blankAsAbsent<T extends z.ZodType>(schema: T) {
  return z.preprocess(value => (value === '' ? undefined : value), schema);
}

export const env = createEnv({
  server: {
    // Logging
    LOG_LEVEL: blankAsAbsent(z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info')),

    // App
    APP_BASE_URL: blankAsAbsent(z.url().default('http://localhost:3000')),

    /*
      Indexing switch. Defaults to off so a staging deploy cannot be indexed by forgetting a variable —
      production has to turn it on deliberately. Read from step 2.
    */
    ROBOTS_ENABLED: blankAsAbsent(
      z
        .enum(['true', 'false'])
        .default('false')
        .transform(value => value === 'true')
    ),

    /*
      Whether the deployment sits behind a proxy trusted to set `X-Forwarded-For` (step 18). Off by
      default: a wrong "true" lets a client forge its own address, slipping past the per-caller rate
      limits. Turn it on only with a real proxy.
    */
    TRUSTED_PROXY: blankAsAbsent(
      z
        .enum(['true', 'false'])
        .default('false')
        .transform(value => value === 'true')
    ),

    /*
      The total the GridFS bucket (vehicle and product images, message attachments, invoice PDFs) may
      hold (step 9). Defaulted, because it differs per deployment — a generous ceiling for a clone,
      tuned per environment.
    */
    STORAGE_CAP_BYTES: blankAsAbsent(
      z.coerce
        .number()
        .int()
        .positive()
        .default(512 * 1024 * 1024)
    ),

    /*
      Required from here on: the data model landed and every service reads it. The database name is NOT
      taken from this string — `lib/mongodb.ts` passes it explicitly, so an Atlas URI copied without its
      path segment cannot silently write to a database called `test`.
    */
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

    /*
      Required from here on: the session lands and every sign-in mints a token with it. A missing or
      short secret means a session can be forged, so a blank value fails the build rather than shipping a
      forgeable session — generate one with `openssl rand -base64 32`.
    */
    AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),

    /*
      Mail (step 6 on). The log transport is selected by the **absence** of `SMTP_HOST`: it writes each
      message, with its link, to the logger, so the whole flow can be walked with no mail server. The
      rest are read only on the SMTP path.
    */
    SMTP_HOST: blankAsAbsent(z.string().min(1).optional()),
    SMTP_PORT: blankAsAbsent(z.coerce.number().int().min(1).max(65535).default(587)),
    SMTP_USER: blankAsAbsent(z.string().min(1).optional()),
    SMTP_PASSWORD: blankAsAbsent(z.string().min(1).optional()),
    SMTP_FROM: blankAsAbsent(z.string().min(1).default('Vehicle Utilities <no-reply@localhost>')),
  },
  experimental__runtimeEnv: process.env,
});
