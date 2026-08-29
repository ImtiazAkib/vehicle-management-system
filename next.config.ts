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
  The Content-Security-Policy. `frame-ancestors 'none'` forbids embedding (clickjacking); `object-src
  'none'` kills plugin embeds; `base-uri`/`form-action 'self'` stop base-tag and form hijacks. Fonts and
  images are self-hosted (next/font, GridFS) so no external host is allowed. Scripts and styles carry
  `'unsafe-inline'` because Next's hydration bootstrap and Tailwind's injected styles are inline and this
  app mints no nonces; dev additionally needs `'unsafe-eval'` and a `ws:` socket for hot reload.
*/
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${production ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${production ? '' : ' ws:'}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

/*
  Every response carries the security headers below. HSTS is production-only — pinning HTTPS on localhost
  would lock a developer out of a plain-http dev server.
*/
const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  ...(production ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
];

/*
  `output: 'standalone'` exists for the PM2 deployment, which runs `.next/standalone/server.js`. Vercel
  packages the output itself and the standalone copy step fails there, so it is left off when VERCEL is
  set — which Vercel does on every build.
*/
const nextConfig: NextConfig = {
  output: selfHosted ? 'standalone' : undefined,
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
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
