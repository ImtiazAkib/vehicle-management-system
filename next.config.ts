import type { NextConfig } from 'next';

/*
  Imported for the side effect, not for a value: both modules validate on load, so a missing or malformed
  variable fails the build here rather than surfacing on some request later.
*/
import '@/env/client';
import '@/env/server';

const production = process.env.NODE_ENV === 'production';
const selfHosted = !process.env.VERCEL;

/*
  `output: 'standalone'` exists for the PM2 deployment, which runs `.next/standalone/server.js`. Vercel
  packages the output itself and the standalone copy step fails there, so it is left off when VERCEL is
  set — which Vercel does on every build. The security headers land in step 18.
*/
const nextConfig: NextConfig = {
  output: selfHosted ? 'standalone' : undefined,
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  /*
    The pino transport worker breaks when bundled; nodemailer (step 6) reaches for Node built-ins and its
    own dynamic requires. Both must stay external rather than be traced into the server chunk.
  */
  serverExternalPackages: production ? ['nodemailer', 'pino'] : ['nodemailer', 'pino', 'pino-pretty'],
  compiler: {
    removeConsole: production ? { exclude: ['error', 'warn'] } : false,
  },
};

export default nextConfig;
