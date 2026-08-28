import type { NextConfig } from 'next';

const selfHosted = !process.env.VERCEL;
const production = process.env.NODE_ENV === 'production';

/*
  Step 0 keeps this minimal so the empty app compiles. The typed-env import that fails the build on
  a bad variable (step 1), the `serverExternalPackages` for pino and nodemailer (steps 1 and 6), and
  the security headers (step 18) each arrive with the step that introduces them.

  `output: 'standalone'` exists for the PM2 deployment, which runs `.next/standalone/server.js`.
  Vercel packages the output itself and the standalone copy step fails there, so it is left off when
  VERCEL is set — which Vercel does on every build.
*/
const nextConfig: NextConfig = {
  output: selfHosted ? 'standalone' : undefined,
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  compiler: {
    removeConsole: production ? { exclude: ['error', 'warn'] } : false,
  },
};

export default nextConfig;
