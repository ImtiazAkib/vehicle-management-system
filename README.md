# Vehicle Utilities Supply and Maintenance System

Centralize every vehicle's profile and service history, automate the maintenance schedule so a service date is
never missed, and book work from verified service centers and order supplies from verified suppliers — with
role-scoped dashboards for owners, service centers, suppliers and administrators. Keep every vehicle on the road.

**Next.js 16 · React 19 · TypeScript (strict) · Tailwind v4 · MongoDB/Mongoose · `jose` sessions · GridFS uploads · `node-cron` reminders · English only.**

> **Current state.** Nothing is built yet — this repository is the **plan**, and the build is executed one step
> at a time against it. The [implementation plan](docs/IMPLEMENTATION-PLAN.md) lays out **steps 0–20, every one
> not started**, and names what each delivers: the toolchain and design tokens, the data-access primitives, the
> SEO and crawler surface, the Mongoose data model and its DTOs, the `jose` session and RBAC spine, the
> role-scoped dashboard shell, self-registration with email verification and admin approval, vehicle records,
> the **maintenance-reminder cron**, service **booking** and center operations, the **marketplace** of verified
> suppliers, orders with atomic stock, invoices and payments, owner↔center messaging, multi-channel
> notifications, reviews and reports, then the hardening, polish, tests, CI and deployment. Each step is
> self-contained and ends on a green lint, format, `tsc`, test and build; the database round-trips run as
> `verify:*` scripts against a real cluster. Deployment is documented in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md),
> the visual walkthrough is [`docs/project-overview.html`](docs/project-overview.html), and the sequencing is the
> [roadmap](#roadmap).

---

## Contents

- [Overview](#overview)
- [Roles](#roles)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment](#environment)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Conventions](#conventions)
- [Design system](#design-system)
- [SEO and structured data](#seo-and-structured-data)
- [Data layer](#data-layer)
- [Authentication](#authentication)
- [Roadmap](#roadmap)
- [Toolchain notes](#toolchain-notes)
- [Deployment](#deployment)
- [Naming](#naming)

## Overview

Vehicle upkeep usually lives in tools that were never meant to carry it — a service history in a glovebox
folder, a reminder in someone's head, a mechanic found by phoning around, and a parts order in a text message.
Each of those is a place the truth drifts: a filter is a month overdue before anyone notices, a receipt is lost
before the warranty claim, and the one service center that did good work last year is a number nobody kept. This
platform makes each one a single source of truth — a vehicle profile that owns its own history, a schedule that
computes the next due date and reminds before it lapses, a booking that only reaches **verified** centers, and a
marketplace that only lists **verified** suppliers.

The scope is deliberately a **two-sided coordination platform**: owners on one side; service centers and
suppliers on the other; administrators governing the perimeter. Nobody transacts across it until an administrator
has vouched for them. **An unverified supplier is a listing, not a transaction.**

The proposal's objectives, and where each is delivered:

| Objective                                            | Delivered in                                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Centralize vehicle profiles and service history      | [Step 7 — Vehicles & records](docs/IMPLEMENTATION-PLAN.md#step-7)                  |
| Automate maintenance schedules with reminders        | [Step 8 — Scheduling & the reminder cron](docs/IMPLEMENTATION-PLAN.md#step-8)      |
| Online service booking against verified centers      | [Step 9 — Booking & service requests](docs/IMPLEMENTATION-PLAN.md#step-9)          |
| Utility supplies from verified suppliers             | [Step 11 — Marketplace: suppliers & products](docs/IMPLEMENTATION-PLAN.md#step-11) |
| Track invoices, payments and cost                    | [Step 13 — Invoices & payments](docs/IMPLEMENTATION-PLAN.md#step-13)               |
| Real-time coordination — messaging and notifications | [Steps 14–15 — Messaging & notifications](docs/IMPLEMENTATION-PLAN.md#step-14)     |

## Roles

Access is decided by role, not by convention. Every route and every action is gated in one place — the proxy
asks "is there a session", the page asks "is it the right role", and the service re-checks besides. Role is
**immutable after creation**; nobody changes their own role or access, and accounts are **deactivated, not
deleted**, by default. **Deactivated is reversible; deleted is a decision you make once.**

| Capability                                        | Admin[^sa] | Owner | Service center | Supplier |
| ------------------------------------------------- | :--------: | :---: | :------------: | :------: |
| Verify and approve service centers & suppliers    |     ●      |   —   |       —        |    —     |
| Govern accounts — activate, deactivate            |     ●      |   —   |       —        |    —     |
| View platform-wide reports                        |     ●      |   —   |       —        |    —     |
| Register and manage own vehicles                  |     —      |   ●   |       —        |    —     |
| Set maintenance schedules and receive reminders   |     —      |   ●   |       —        |    —     |
| Book services from verified centers               |     —      |   ●   |       —        |    —     |
| Accept, decline and progress assigned requests    |     ○      |   —   |       ●        |    —     |
| Record maintenance performed & issue invoices     |     ○      |   —   |       ●        |    —     |
| Order supplies from verified suppliers            |     —      |   ●   |       —        |    —     |
| List products and manage stock                    |     ○      |   —   |       —        |    ●     |
| Fulfil orders through their transitions & invoice |     ○      |   —   |       —        |    ●     |
| Pay own invoices                                  |     —      |   ●   |       —        |    —     |
| Message about a booking (owner ↔ center)          |     —      |   ●   |       ●        |    —     |
| Review centers, suppliers and products            |     ○      |   ●   |       —        |    —     |

● full · ○ oversight (read/moderate, not author) · — no access

Admin is the perimeter, not a super-user: it verifies centers and suppliers, governs accounts, and reads the
platform-wide reports — but it **deliberately does not book, sell, ship or routinely invoice** on anyone's
behalf. Its ○ cells are oversight, not authoring. Owners self-register and are usable on email verification;
service centers and suppliers self-register too, but become **transactable only after admin verification**.

[^sa]:
    `super-admin` is the single permanent account above a bounded set of `admin`s — a **partial unique index on
    `role`** guarantees exactly one. It is **seeded, never created through a screen**, immutable even to itself,
    and the only account that may create, promote, approve, revoke, activate, deactivate or delete an `admin`. It
    borrows the admin area (`/admin`) and the admin (violet) accent.

## Tech stack

| Layer        | Choice                                               | Why                                                                                            |
| ------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Framework    | Next.js 16 (App Router, RSC), React 19               | Server-first; the dashboards are server components and every mutation is a Server Action.      |
| Language     | TypeScript, `strict`                                 | `type` aliases only — no `interface`, no `any`, no unchecked casts; DTO mappers instead.       |
| Styling      | Tailwind v4 + shadcn on Base UI                      | Inline utilities against design tokens; `cn()` for conditionals, never a `className` constant. |
| Localization | **None — English only**                              | Copy is literal text in the JSX; no `next-intl`, no `[locale]` segment, no `l10n/`.            |
| Database     | MongoDB + Mongoose 9                                 | `dbName` set in code; a GridFS `uploads` bucket; partial unique indexes enforce the rules.     |
| Validation   | zod 4                                                | One schema per action; the service consumes the parsed output, never the raw form.             |
| Auth         | `jose` session JWT in an httpOnly cookie             | No auth library; the session carries the role, and revocation is a live per-request re-check.  |
| Reminders    | `node-cron` worker + a queue                         | A second PM2 app sweeps schedules that fell **DUE** and enqueues notifications, idempotently.  |
| Mail / SMS   | `nodemailer` (smtp/log seam); Twilio when configured | Absence of SMTP config selects the log transport, so a clean clone still "sends".              |
| Payments     | Invoice/Payment records; Stripe optional             | Absent `STRIPE_*` disables the card channel; the ledger still records and marks **PAID**.      |
| Images       | `sharp` → WebP                                       | Magic-byte verified, compressed against pixel-bombs, capped in GridFS. No SVG, by design.      |
| Logging      | `pino` (pretty in dev, JSON in prod)                 | Ids and outcomes only — no name, email, token or storage key ever becomes a log field.         |
| Money        | Integer minor units                                  | Floating-point money is a bug with a delay on it.                                              |

Dependencies are **pinned exact** — no `^`, no `~` — so a fresh `npm install` resolves the same tree every time.

## Getting started

Prerequisites: **Node 20+**, a **MongoDB** connection string (Atlas or local).

```bash
npm install
cp .env.example .env.local     # then fill MONGODB_URI and AUTH_SECRET
npm run dev                    # http://localhost:3000
```

The first administrator is **seeded, not registered** — set `SEED_SUPER_ADMIN_*` in `.env.local` and run:

```bash
npm run seed:super-admin
```

There is exactly one super administrator, enforced by a partial unique index — the seed is idempotent, so
running it twice is a no-op, not a duplicate. For a throwaway department to click around, `npm run seed:demo`
writes an admin, two service centers, two suppliers, a handful of owners with vehicles, some products, a booking
and an order.

## Environment

Copy `.env.example` to `.env.local`. Every variable is read through the validated `env` module (`env/server.ts`)
— **never `process.env` directly** — and `env/server.ts` is imported by `next.config.ts`, so an invalid value
**fails the build** before it starts, not at runtime in front of a user. An empty right-hand side is treated as
absent, so `cp .env.example .env.local` compiles for everything except the two required secrets, which fail
loudly by design.

| Variable            | Required      | Default                                  | Purpose                                                                      |
| ------------------- | ------------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| `MONGODB_URI`       | **yes**       | —                                        | Mongo connection string. The database name is set in code, not the URI.      |
| `AUTH_SECRET`       | **yes** (≥32) | —                                        | Signs the session JWT (HS256). `openssl rand -base64 32`.                    |
| `APP_BASE_URL`      | no            | `http://localhost:3000`                  | Absolute-URL base for metadata, sitemap, OG image and mail links.            |
| `LOG_LEVEL`         | no            | `info`                                   | `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace`.                |
| `ROBOTS_ENABLED`    | no            | `false`                                  | `true` only on production; otherwise the whole surface is `noindex`.         |
| `TRUSTED_PROXY`     | no            | `false`                                  | Trust `x-forwarded-for` for unauth rate limits + the caller sign-in ceiling. |
| `STORAGE_CAP_BYTES` | no            | `536870912` (512 MB)                     | GridFS ceiling for uploads. Warn at 85%, block at 95%.                       |
| `SMTP_HOST`         | no            | — (log transport)                        | Set to enable real email; unset writes messages to the log.                  |
| `SMTP_PORT`         | no            | `587`                                    | `465` selects TLS.                                                           |
| `SMTP_USER`         | no            | —                                        | SMTP auth user.                                                              |
| `SMTP_PASSWORD`     | no            | —                                        | SMTP auth password.                                                          |
| `SMTP_FROM`         | no            | `Vehicle Utilities <no-reply@localhost>` | The `From` header on outgoing mail.                                          |
| `TWILIO_*`          | no            | — (SMS disabled)                         | Absent disables the SMS notification channel.                                |
| `STRIPE_*`          | no            | — (card disabled)                        | Absent disables card payments; invoices still record and settle.             |

`SEED_SUPER_ADMIN_NAME` / `_EMAIL` / `_PASSWORD` are read **only** by `npm run seed:super-admin`, never by the
app. They live in `.env.local` as documentation, commented in `.env.example`.

## Scripts

| Script                      | What it does                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------- |
| `npm run dev`               | Next dev server.                                                                    |
| `npm run build`             | Production build (includes the TypeScript pass).                                    |
| `npm run build:linux`       | Build + copy `static`/`public` into `.next/standalone` for a PM2 deploy.            |
| `npm run start`             | Serve the production build.                                                         |
| `npm run lint` / `lint:fix` | ESLint — import order, cspell, canonical Tailwind classes, unused imports.          |
| `npm run format` / `:write` | Prettier check / write over `ts,tsx,js,mjs,html,scss,json,md`.                      |
| `npm run test` / `:watch`   | Vitest over the pure cores — no database (session, money, due, transitions, files). |
| `npm run smoke`             | Runs the `verify:*` family in sequence against a real database.                     |
| `npm run seed:super-admin`  | Create the one permanent super administrator from `SEED_SUPER_ADMIN_*`; idempotent. |
| `npm run seed:demo`         | Throwaway demo data — an admin, centers, suppliers, owners, products, a booking.    |
| `npm run send:reminders`    | The maintenance-reminder cron entrypoint — the second PM2 app's command.            |
| `npm run verify:*`          | Per-service integration harnesses against a live database; each self-cleans up.     |
| `npm run prepare`           | Install husky hooks.                                                                |

The `verify:*` family is one script per domain that needs a real database — `verify:data-model`,
`verify:accounts`, `verify:vehicles`, `verify:scheduling`, `verify:bookings`, `verify:marketplace`,
`verify:orders`, `verify:invoices` and `verify:reports`. Each is the regression proof for behavior a mock cannot
vouch for; each writes its own tagged fixtures against a live, mutable MongoDB and deletes them in a `finally`.
All scripts run through `tsx --env-file-if-exists=.env.local`.

## Project structure

Every folder exposes a barrel `index.ts`, and one type lives in one file.

```
app/
  layout.tsx                 root: <html lang="en">, Inter + Poppins, metadata, theme cookie, skip link
  globals.css                Tailwind v4 @theme tokens (light + .dark) + role accents
  (marketing)/               public landing — site chrome · JSON-LD @graph
  (auth)/                    sign-in · register/{owner,service-center,supplier} · verify-email · reset
  (dashboard)/               THE GUARD — requireSession() + the role-scoped shell; noindex
    owner/                   vehicles · schedules · bookings · marketplace · orders · invoices · messages
    center/                  requests · records · invoices · messages · profile
    supplier/                products · orders · invoices · profile
    admin/                   users · verifications · reports
    profile/                 the account anybody edits themselves
  api/                       uploads (image in; access-checked view/download) · messages/[id] send
  robots.ts · sitemap.ts · llms.txt/ · llms-full.txt/ · opengraph-image.tsx
proxy.ts                     Next 16 middleware — same-origin API perimeter + route guard
components/
  owner/ center/ supplier/ admin/            one folder per dashboard
  auth/ dashboard/ marketplace/ vehicles/    feature modules
  scheduling/ bookings/ messages/ shared/ ui/
constants/                   app-data · roles · auth · rate-limit · codes · datetime · database · SEO
env/                         zod-validated server environment (imported by next.config.ts)
models/                      Mongoose documents, one per file (+ RateLimit out of the barrel)
lib/
  result/                    SingleResult · ListResult · EmptyResult and their factories
  api/                       response helpers (withOk/withForbidden/…) + same-origin & content-length guards
  auth/                      session · cookie · current-user · guards · admin-area gate
  schemas/                   zod, {entity}-{action}.schema.ts
  services/                  one class per entity — the only place business rules live
  storage/ mail/ utils/      GridFS uploads · smtp/log mail seam · helpers
  logger.ts · mongodb.ts
types/                       one type per file; {entity}.dto.ts holds the DTO + its mapper
scripts/                     seed:super-admin · seed:demo · send:reminders · verify:*
docs/                        IMPLEMENTATION-PLAN.md · DEPLOYMENT.md · project-overview.html
.husky/                      pre-commit · commit-msg · pre-push
```

Two rules are load-bearing:

- **Barrels re-export everything except `actions.ts`.** A `'use server'` module re-exported through a barrel
  drags every action into the client graph, so actions are imported by relative path — as is anything inside a
  `'use client'` graph.
- **`proxy.ts` and the models import the specific constant module, never the `@/constants` barrel**, because the
  barrel pulls in `lucide-react`; and utils that touch mongoose are imported with `import type` so the
  `@/lib/utils` barrel stays client-safe.

## Conventions

- **Imports** are grouped and blank-line separated, enforced by ESLint: react/next → third-party → `@/*` →
  relative → `import type` last, alphabetized within each group.
- **Components** are organized by domain, not by type. A feature module holds its `*-screen` (the sole
  `'use client'` orchestrator), its `*.form.tsx`/`*.dialog.tsx`, `*.types.ts`, `actions.ts` and `index.ts`.
  Route-local pieces live in a `_components/` folder. Handlers are `handleXxx`, placed last.
- **Types** use `type` aliases only — never `interface`. Props are `<Component>Props`. DTO mappers name every
  field explicitly, so a secret cannot leak by being forgotten.
- **Styling** is inline Tailwind utilities against design tokens; `cn()` merges conditionals. No `className`
  constants, no color literals — tokens only, so dark mode is free.
- **Business logic** lives in services, checked against the session — never in a component. A server action is a
  public endpoint the screen cannot vouch for: it gates, validates with zod, calls the service, and returns the
  service's `Result` unchanged.
- **Money** is integer minor units everywhere; no float ever touches a total, and order lines snapshot the price
  they were sold at.
- **Spelling** is US English, enforced by cspell over `.ts`/`.tsx`. A new domain word goes in
  `cspell.config.json`, never behind an inline disable.

A step is **done** only when format is clean, lint is green, the build passes, the affected screens render with
no console errors in light and dark, new files are in their barrels, no secret reaches a log or a URL, and this
project's plan status table is updated. The full checklist is in
[Definition of done](docs/IMPLEMENTATION-PLAN.md#definition-of-done).

### Git hooks

Installed by `npm run prepare`. The checks are enforced, not remembered.

| Hook         | Runs                                                                                   |
| ------------ | -------------------------------------------------------------------------------------- |
| `pre-commit` | Branch-name check, then `npm run lint`, then `npm run format`.                         |
| `commit-msg` | `commitlint` — Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`). |
| `pre-push`   | `npm run build` — the type check, once per push.                                       |

Branch names must match `^(feature/|bugfix/|release/|hotfix/)[a-z0-9-]+$`. `--no-verify` is a documented last
resort, not a workflow.

## Design system

`app/globals.css` defines the full **light** palette on `:root` via Tailwind v4's `@theme inline` and redefines
only the changed tokens under a class-based `.dark`. A server-read theme cookie ships the class on `<html>` so
there is no flash, behind a three-way toggle (light / dark / system). The core tokens are
`background`/`foreground`/`card`/`muted`, `primary` a confident **indigo**, and `success`/`warning`/`destructive`
for state.

Four **role accents** double as labels, not decoration: `accent-violet` (admin), `accent-blue` (owner),
`accent-teal` (service-center), `accent-amber` (supplier). They tint the role badge and sidebar so a supplier and
a service center sharing a screen can see whose session is open, applied as text/icon color only and
contrast-verified as text-on-card.

### Type

**Inter** on the body, **Poppins** on headings, both via `next/font` with `--font-body` / `--font-display`
indirection — one line changes a typeface. There is no per-language font swap, because there is one language.

## SEO and structured data

Everything is derived from `APP_BASE_URL`, and indexing is **off until a deploy opts in**.

| Route              | Serves                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/sitemap.xml`     | One entry per public route, an explicit list rather than a filesystem crawl.              |
| `/robots.txt`      | `Disallow: /` unless `ROBOTS_ENABLED`; then allows all but the private segments.          |
| `/llms.txt`        | Short index for LLM crawlers, cached an hour, built from the same lists the page renders. |
| `/llms-full.txt`   | The long form — every landing section as markdown.                                        |
| `/opengraph-image` | 1200×630 social card generated at request time with `next/og`.                            |

Two things to know: indexing says it twice when off (`Disallow: /` **and** page `noindex`), so a staging host
cannot leak into a search index; and JSON-LD is typed with `schema-dts` as an escaped `@graph`
(`Organization` → `WebSite` → `SoftwareApplication`) with no client JS, so a node outside the schema.org
vocabulary fails the build rather than a validator after deploy.

## Data layer

Every write takes one layered path: a form submits to a server action, which validates with zod, calls a
service, which reads and writes through a Mongoose model and maps rows to DTOs. A rejected action comes back as
**data the form can render field by field**, not as an exception someone has to catch.

### MongoDB

`lib/mongodb.ts` caches the connection on `globalThis` so dev module re-evaluation and per-handler scope reuse
one socket. It connects with `dbName` from `constants/database.const.ts` — owned by code, never read from the
URI path — and `bufferCommands: false` so a query against a dropped connection fails fast instead of hanging.

### Models

Sixteen domain documents, one per file, each guarded with `mongoose.models.X ?? mongoose.model(...)`. Times are
real `Date`s compared through the pinned timezone; money is integer minor units; **storage keys are server-only
and never reach a DTO**; rules are indexes, not hopeful service checks.

| Model                      | Carries                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `User`                     | Identity, credentials (`password`, `select:false`, bcrypt salt 12), role, approval and active flags, verification token hashes. |
| `ServiceCenterProfile`     | A center's public brand — name, address, geo, services offered, hours, rating, `isVerified`. 1:1 to `User`.                     |
| `SupplierProfile`          | A supplier's public brand — business name, address, rating, `isVerified`. 1:1 to `User`.                                        |
| `Vehicle`                  | Owner, make/model/year, unique `vin` and `registrationNo`, fuel and transmission, mileage.                                      |
| `MaintenanceSchedule`      | The vehicle, service type, month/mileage intervals, next-due date and mileage, status, `lastNotifiedAt`.                        |
| `MaintenanceRecord`        | What was actually performed — vehicle, optional request/center, mileage at service, cost, date.                                 |
| `ServiceRequest`           | A booking — vehicle, owner, center, priority, preferred/scheduled dates, status, estimate/final cost.                           |
| `Product`                  | A utility supply — supplier, category, unique `sku`, price, stock, active flag.                                                 |
| `Order` / `OrderItem`      | Buyer, supplier, status, money totals, payment status; items snapshot the unit price sold at.                                   |
| `Invoice`                  | `SERVICE` or `ORDER`, the referenced booking/order, owner, issuer, totals, status, dates.                                       |
| `Payment`                  | The invoice, amount, method, status and an optional transaction reference.                                                      |
| `Conversation` / `Message` | Owner↔center threads (optionally tied to a booking) and their messages.                                                         |
| `Notification`             | The multi-channel feed row — `IN_APP`/`EMAIL`/`SMS`/`PUSH`, read flag.                                                          |
| `Review`                   | An owner's rating of a `SERVICE_CENTER`, `SUPPLIER` or `PRODUCT`, recomputing the target's average.                             |

Guarantees that are **indexes, not queries**: exactly one super-admin (a partial unique index on `role`), a `vin`,
a `registrationNo` and a `sku` that cannot repeat, and order fulfilment that decrements stock **atomically** so
the last unit sells once. And booking and order status move **only through their action-based service methods
behind a legal-transition guard** — never a raw status write. **A raw status write is a state machine with the
guard taken off.**

The infra `RateLimit` model (no timestamps, a TTL sweep) exists but is deliberately **out of the models barrel** —
it is imported directly by the rate-limit guard, never through `@/models`.

### DTOs

DTO types and their `xFromEntity` mappers live in `types/{entity}.dto.ts`, not in the services. A mapper names
every field explicitly, turns `_id` into a string id, dates into ISO strings and `undefined` into `null` — so
`password`, `_id`, `__v` and any `storageKey` cannot leak by being forgotten. No Mongoose document ever reaches
the UI; the session's own shape is a narrow `SessionUser` (`userId`, `email`, `name`, `role`, `isApproved`).

### The Result pattern

Services and server actions **never throw for an expected failure** — an unverified center, a duplicate email, an
out-of-stock product. They return a `SingleResult<T>` / `ListResult<T>` / `EmptyResult`, each
`{ success, result, errors, messages }`, built through factories. Errors carry a **five-digit code**
(`[layer][feature][sequence]` — layers `1` Database, `2` Validation, `3` Business, `5` Auth; features `0` Common
through `7` Billing) and an optional `field`, so a form can attach the message to the input that caused it. Only
genuinely exceptional faults throw. **A refused action is data, not an exception.**

### Logging

`pino`, pretty in development and single-line JSON in production, bound with `createLoggerWithContext`. Log fields
are ids and outcomes — **never a name, email, token or storage key**. An id is fine; a bearer secret in a log
line is a breach with a timestamp.

## Authentication

No auth library. A sign-in mints a JWT with `jose` (HS256, issuer and audience `vehicle-utilities` pinned),
stored in an httpOnly, `sameSite=lax`, prod-`secure` cookie named `vusms.session` with a **1-hour** max age.

### What the session carries

Identity and authorization only — `userId`, `email`, `name`, `role`, `isApproved`. Nothing sensitive: the session
is a bearer credential, and a bearer credential holds the least it can.

### Revocation

The signature proves provenance, not that the account is still allowed. `getSessionUser` loads the **live `User`
row on every call** and re-checks `isActive`, `isApproved` and the role — so deactivating a supplier or
un-approving a center takes effect on their next request, within the hour, not at token expiry. On a database
outage it **fails closed for admin and super-admin**, open for owner, service-center and supplier.

### Refusals

`AuthService.verifyCredentials` is anti-enumeration: a wrong email and a wrong password cost the same time (bcrypt
runs against a constant dummy hash even when no account matched) and return the same code, and the identifier is
never logged. Sign-in is rate-limited **5 per 15 min per identifier**, plus a **30 per 15 min per caller** ceiling
that only engages behind `TRUSTED_PROXY`. Verification and reset tokens are 32 random bytes, stored **only as
SHA-256 hashes**, single-use, valid 24h, with a 2-minute resend cooldown. **An error that tells an anonymous
visitor which half they got wrong is a user-enumeration endpoint with good manners.**

### The route guard

`proxy.ts` is Next 16's middleware file (the renamed `middleware.ts`). It closes the same-origin API perimeter,
and for `PROTECTED_SEGMENTS` (`/owner`, `/center`, `/supplier`, `/admin`, `/profile`) it does signature-only
verification at the edge — no database there — and redirects an anonymous visitor to `/sign-in?next=…`. The
matcher excludes `_next`, `_vercel` and dotted paths. The proxy answers "is there a session"; the page answers "is
it the right role"; the service re-checks besides, and server actions re-gate the admin area through
`gateAdminArea`.

## Roadmap

The proposal's phases, mapped onto the [21 steps](docs/IMPLEMENTATION-PLAN.md#steps). Every step is **not started**
— this is the build order.

| Phase                                       | Activity                                                                       | Deliverable                                                    | Week     | Steps |
| ------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- | -------- | ----- |
| Foundation & tooling                        | Scaffold, tooling, typed config, design tokens, data-access primitives         | The repo that lints, builds and themes                         | Week 1   | 0–1   |
| Discoverability                             | The SEO/crawler surface                                                        | robots, sitemap, llms.txt, OG image                            | Week 1   | 2     |
| Domain model & authentication               | Mongoose models + DTOs and the `jose` session/RBAC spine                       | The data layer and the guard                                   | Week 2   | 3–4   |
| Dashboards & accounts                       | Role-scoped shell, registration, verification and approval                     | Sign-in, self-registration, admin verification                 | Week 2–3 | 5–6   |
| Vehicles, maintenance & booking             | Vehicle records, the reminder scheduler, service booking and center operations | Profiles, the reminder cron, bookings, center ops              | Week 3–4 | 7–10  |
| Marketplace, orders & billing               | Suppliers & products, orders, and invoices & payments                          | The marketplace, atomic orders, the ledger                     | Week 4–5 | 11–13 |
| Messaging, notifications, reviews & reports | Owner–center messaging, multi-channel notifications, reviews and analytics     | The coordination and reporting surface                         | Week 5–6 | 14–17 |
| Hardening, polish & release                 | Security hardening, the finish pass, tests, CI and deployment                  | Rate limits, the polish pass, the Vitest suite, CI, the deploy | Week 6+  | 18–20 |

## Toolchain notes

Two deliberate hold-backs carry over from the sibling repos and should be re-checked before either is bumped:

| Package      | Pinned reason                                                    |
| ------------ | ---------------------------------------------------------------- |
| `typescript` | Held below 7.0 — `typescript-eslint` will not load under it yet. |
| `eslint`     | Held below 10 — `eslint-config-next` has no ESLint 10 support.   |

Everything else is pinned exact for a reproducible install, and the unit tests (`npm run test`) cover the pure
cores — session, money, schedule-due math, booking and order transitions, and file-signature checks — with no
database in sight, so they run in CI on every push.

## Deployment

`next build` with `output: 'standalone'` (skipped when `VERCEL` is set, where it breaks on a trace file), run
under PM2 from `ecosystem.config.js` on **port 3104**, behind a reverse proxy that terminates TLS and sets
`x-forwarded-for`. This project runs **two PM2 apps**: the web app, and a second app that runs the
maintenance-reminder cron via `npm run send:reminders` on a `cron_restart` schedule. That `x-forwarded-for` header
is why `TRUSTED_PROXY` exists — a rate limiter behind a proxy that does not set it is **one bucket for the whole
internet**, so `TRUSTED_PROXY=true` and `proxy_set_header X-Forwarded-For` are a pair you set together or not at
all.

Flip `ROBOTS_ENABLED=true` only on the production host; staging stays out of every index. The build fails on a
missing or invalid environment variable before it starts.

**The full deployment runbook — prerequisites, the two-app PM2 bring-up, the complete nginx block, the
production-only variable values, and the staging verify run — is [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).**

## Naming

The product name, tagline, currency and timezone are placeholders. They live in exactly three constants and are
the only things a real deployment renames: `NAME` (`VUSMS`), the tagline (`Keep every vehicle on the road.`) and
the currency in `constants/app-data.const.ts`, `DEFAULT_TIMEZONE` in `constants/datetime.const.ts`, and the
database name in `constants/database.const.ts`. Nothing else hard-codes any of them.
