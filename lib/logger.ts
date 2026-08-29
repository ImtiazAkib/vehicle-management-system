import pino from 'pino';

import { env } from '@/env/server';

const production = process.env.NODE_ENV === 'production';

/*
  Structured JSON in production so the output is machine-readable; pretty-printed and colorized in
  development so it is human-readable. `pino` and `pino-pretty` are listed in `serverExternalPackages` —
  bundling them breaks the transport worker.

  **No password, token or email address is ever a log field.** An id is fine; a credential is not. The
  `redact` paths below enforce it rather than trusting every call site to remember: a secret that reaches
  a log field is removed before the line is written, because logs travel to places the access rules in
  this app do not reach.
*/
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: ['password', 'token', 'email', '*.password', '*.token', '*.email', 'req.headers.authorization', 'req.headers.cookie'],
    remove: true,
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
  ...(!production && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
        levelFirst: true,
      },
    },
  }),
});

/**
 * Create a child logger that tags every line with where it came from.
 *
 * @param context - Context name, usually the service or route.
 *
 * @returns A logger with the context bound to it.
 *
 * @example
 * ```ts
 * const log = createLoggerWithContext('vehicle.service');
 * log.info({ vehicleId }, 'Registered a vehicle');
 * ```
 */
export function createLoggerWithContext(context: string) {
  return logger.child({ context });
}
