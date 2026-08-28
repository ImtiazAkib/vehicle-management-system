/*
  Both apps start with one `pm2 start ecosystem.config.js` from the repository root, but they run from
  different places on purpose, so each names its own `cwd`.

  The web app is the standalone build — a self-contained `server.js` that `next build` writes to
  `.next/standalone/`. It does NOT run from the repo root (there is no `server.js` there), so its `cwd`
  points into the standalone output. The reminder sweep runs `npm run send:reminders`, which needs the
  repository's `scripts/` and its dev dependency `tsx`, neither of which the standalone bundle
  contains — so it runs from the root.

  Production secrets are NOT in this file. `.env.local` is a dev-only, gitignored file; on the server
  the variables from `.env.example` are supplied to PM2 (extend each `env` block, or export them into
  the process that runs `pm2 start`). Keeping them out of the committed config is the same rule the
  seed command follows.
*/
module.exports = {
  apps: [
    {
      name: 'vehicle-utilities',
      cwd: './.next/standalone',
      script: './server.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      time: true,
      env: {
        PORT: 3104,
        NODE_ENV: 'production',
      },
    },
    /*
      The maintenance-reminder sweep (step 8). A second app that runs `npm run send:reminders` on a
      `cron_restart` schedule rather than an in-process timer, because a restart-prone web instance is
      not guaranteed to be alive at the minute a schedule comes due — the schedule is the clock, not
      the app. `autorestart` is off: this is a task that runs to completion and exits, not a server to
      keep up, so PM2 must not treat its clean exit as a crash and relaunch it in a loop. Running it
      twice is safe by construction — the sweep sets `lastNotifiedAt` before it sends, so an
      overlapping or repeated run reminds nobody twice.
    */
    {
      name: 'vehicle-utilities-reminders',
      cwd: './',
      script: 'npm',
      args: 'run send:reminders',
      exec_mode: 'fork',
      instances: 1,
      autorestart: false,
      // Every hour, on the hour. The sweep's due-window is wider than the interval, so a missed tick
      // is caught by the next one rather than dropping a reminder.
      cron_restart: '0 * * * *',
      time: true,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
