# Deployment

How the app is built once and comes up the same way every time: a standalone Next build, run under PM2 on port
`3104`, behind a reverse proxy that terminates TLS and sets `X-Forwarded-For`. Every step below is runnable from a
clean checkout.

The authoritative list of environment variables, with the rationale for each, is [`.env.example`](../.env.example).
This document says how they are set in production and what a wrong value costs; it does not restate the file.

---

## What runs where

```
                          TLS terminated here
   Internet ── HTTPS ──►  Reverse proxy (nginx)  ── HTTP ──►  PM2: vusms
                          sets X-Forwarded-For                Next standalone server.js
                          sets X-Forwarded-Proto              listens on 127.0.0.1:3104
                                                              │
                                                              └── MongoDB (Atlas or self-hosted)

   PM2: vusms-reminders   ── cron_restart, on schedule ──►  same MongoDB
   runs `npm run send:reminders`, sweeps DUE schedules, enqueues notifications, exits
```

- **One web instance, fork mode, port 3104.** The app holds no in-process state that a second instance would
  contend on — sessions are stateless signed tokens, the rate-limit counters live in the `ratelimits` collection,
  and the reminder sweep is claimed per schedule in MongoDB — so it scales horizontally behind the proxy when it
  needs to, but a single instance is the baseline.
- **The maintenance-reminder sweep is a separate PM2 app on a cron schedule**, not an in-process timer, so a
  reminder does not depend on the web instance being awake at the minute a schedule falls due. PM2 brings it up via
  `cron_restart`; each run executes `npm run send:reminders`, advances `UPCOMING → DUE → OVERDUE` from date and
  mileage, enqueues the notifications, stamps `lastNotifiedAt`, and exits. See
  [`ecosystem.config.js`](../ecosystem.config.js). **A reminder that depends on the web app being awake is a
  reminder you will miss.**

---

## Prerequisites

- **Node 20 or newer** (the standalone server and the build both target current LTS).
- **A MongoDB database** — an Atlas cluster or a self-hosted server. The connection string goes in `MONGODB_URI`;
  the database name is set in code via `dbName` (`constants/database.const.ts`), not read from the URI, so an Atlas
  URI without a path segment still writes to the right database.
- **PM2** installed on the host (`npm i -g pm2`).
- **A reverse proxy** (nginx below) terminating TLS. Without one in front, `TRUSTED_PROXY` must stay `false` — see
  the proxy section for why.

---

## Environment

Set every variable from [`.env.example`](../.env.example). `.env.local` is a **dev-only, gitignored** file and is
never on the server; supply the production values to PM2 instead — extend each `env` block in
`ecosystem.config.js`, or export the variables into the shell that runs `pm2 start`. The three that differ from
their example defaults on a real production host:

| Variable         | Production value        | Why it changes for production                                                                                                                   |
| ---------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `APP_BASE_URL`   | the public HTTPS origin | Absolute links, verification and reminder email links, and metadata are built from it — it must be the address a visitor uses, not `localhost`. |
| `ROBOTS_ENABLED` | `true`                  | Off everywhere else so staging never enters a search index; flipped on **only** on production.                                                  |
| `TRUSTED_PROXY`  | `true`                  | On only because a real proxy sets `X-Forwarded-For`. A wrong `true` without that proxy lets any client forge its own address — see below.       |

`AUTH_SECRET` is at least 32 characters and is **generated fresh for production** (`openssl rand -base64 32`), not
copied from a dev machine. It signs the `vusms.session` JWT; rotate it and every live session is invalidated at
once, which is the point — a leaked secret is revoked by replacing it.

`MONGODB_URI` is the only other required variable. The build refuses to start without both it and `AUTH_SECRET`.

`SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` are optional, and their absence is a real switch, not a no-op: with no
SMTP host the mailer falls back to logging each message instead of sending it. That is fine for a local smoke test
and **wrong for production**, where an owner who never receives a verification link never finishes registering and
a reminder that only prints to a log reminds no one. `SMTP_PORT` defaults to `587` and `SMTP_FROM` to
`Vehicle Utilities <no-reply@localhost>` — set a real From that your domain is allowed to send as.
**Mail that only logs is mail nobody receives.**

The build itself is the first gate. `env/server.ts` is imported by `next.config.ts`, so a missing or malformed
variable fails `next build` before it starts, rather than surfacing on some request later. **A bad environment
should fail the build, not the visitor.**

---

## Build and run

From a clean checkout on the server:

```bash
npm ci
npm run build:linux
```

`build:linux` runs `next build` (output `standalone` when `VERCEL` is unset) and then copies the two things the
standalone output does not trace itself — `.next/static` and `public/` — into `.next/standalone/`, so `server.js`
can serve them. (`npm run build` alone is the plain build for local `next start`; the `build:linux` copy step is
what the standalone deploy needs.)

Seed the single super administrator once, so someone can sign in. The seed reads its three `SEED_SUPER_ADMIN_*`
variables for this one command only, never from a committed file, and is idempotent — running it again on an
existing super admin changes nothing:

```bash
SEED_SUPER_ADMIN_NAME="Platform Owner" \
SEED_SUPER_ADMIN_EMAIL="owner@vusms.example" \
SEED_SUPER_ADMIN_PASSWORD="a-strong-unique-password" \
npm run seed:super-admin
```

There is exactly one super administrator — a partial unique index on `role` enforces it — and it is never created
or edited through any screen. The seed is the only way it exists.

Bring both PM2 apps up from the repository root, and persist the process list so they survive a reboot:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # follow the one-line instruction it prints
```

The web app runs from `.next/standalone` and the reminder sweep from the repository root — each names its own `cwd`
in the config, so the single `pm2 start` places both correctly. Confirm:

```bash
pm2 status                       # vusms online; vusms-reminders cycling on its cron_restart schedule
pm2 logs vusms --lines 50
curl -I http://127.0.0.1:3104/   # 200, plus the security headers on a page response
```

`vusms-reminders` is brought up by `cron_restart` on schedule, runs the sweep to completion, and exits — so
`pm2 status` catches it **running** at each tick and **stopped** between them. That periodic cycling is the design,
not a crash loop: a run-to-completion task should end when its work is done.

---

## Reverse proxy (nginx)

The proxy terminates TLS and forwards to `127.0.0.1:3104`. The two forwarded headers are not optional: the
unauthenticated rate limiter and the caller-scoped sign-in ceiling read the caller's address from
`X-Forwarded-For`, and the app reads the original scheme from `X-Forwarded-Proto` (that is how the session cookie
knows to set `secure` in production).

```nginx
server {
    listen 443 ssl http2;
    server_name vusms.example;

    # ssl_certificate / ssl_certificate_key configured here.

    location / {
        proxy_pass         http://127.0.0.1:3104;
        proxy_http_version 1.1;

        # The rate limiter and the per-caller sign-in ceiling key on the real caller address.
        # Without this the app sees only the proxy, so every caller shares one bucket — TRUSTED_PROXY
        # exists for exactly this header, and is meaningless if the proxy does not set it.
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;

        # So the app knows the request arrived over HTTPS even though it reached it over plain HTTP.
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Host              $host;
    }
}

server {
    listen 80;
    server_name vusms.example;
    return 301 https://$host$request_uri;   # HTTP → HTTPS
}
```

**`TRUSTED_PROXY=true` and this `proxy_set_header` are a pair.** Turn the flag on only with a proxy that sets the
header: a limiter behind a proxy that does not set it is one bucket for the entire internet, and a limiter with the
flag on but no proxy in front trusts a header any client can forge — letting an attacker rotate the address on
every request and walk straight past the per-identifier and per-caller sign-in limits. Off is the safe default; on
is a deliberate pairing with the proxy config above. **A forged address is a bypassed limit.**

---

## Verifying a deploy against staging

The service behaviours that need a database were each proven against a real cluster in their own step, and those
scripts are the regression suite. Point them at a **staging** cluster (never production data) via that shell's
`MONGODB_URI` and run them; each owns its fixtures and cleans them up, reporting a pass count:

```bash
npm run test               # the pure-core unit suite — session, money, transitions; no database needed
npm run smoke              # runs the whole verify:* family in sequence against the shell's MONGODB_URI

# …or drive the harnesses individually:
npm run verify:data-model
npm run verify:accounts
npm run verify:vehicles
npm run verify:scheduling
npm run verify:bookings
npm run verify:marketplace
npm run verify:orders
npm run verify:invoices
npm run verify:reports
```

Green here plus a page response carrying the security headers and the correct `X-Forwarded-For` behaviour is the
deploy's definition of done. `ROBOTS_ENABLED=true` on production emits an indexable surface; staging, with it off,
stays disallowed — confirm `/robots.txt` reflects the environment it was built for. **Staging that indexes is
production's understudy leaking onto the stage.**

---

## Rolling forward

A new version is the same three commands — `npm ci`, `npm run build:linux`, then `pm2 reload vusms` (a
zero-downtime reload rather than a restart). The reminder app needs no reload; it picks up the new code on its next
`cron_restart` tick. If a build fails its env or type gate, the running instance is untouched — nothing ships until
the build is green. **A deploy that cannot fail safely is not a deploy; it is a coin flip.**
