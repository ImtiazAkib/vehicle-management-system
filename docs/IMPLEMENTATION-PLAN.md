# Implementation Plan

Vehicle Utilities Supply and Maintenance System — **VUSMS** — keeps every vehicle on the road. Owners register their
vehicles and their whole service history in one place, set maintenance schedules that a cron worker turns into reminders
before a service date slips, book work from admin-verified service centers, and order parts and utility supplies — oil,
filters, tires, batteries — from admin-verified suppliers. Invoices and payments track the cost; messaging and reports
coordinate the three sides. Role-based dashboards for **super-administrators**, **administrators**, **vehicle owners**,
**service centers** and **suppliers**.

The build is split into **21 steps**. Each one is self-contained, ends with a green build, and leaves the app in a
working state; the [Status at a glance](#status-at-a-glance) ledger is the source of truth for which are done. Steps 0–10
have landed — through vehicles, the maintenance cron, service booking and center operations; steps 11–20 remain.

> This project follows the shared house style of its sibling repos `ticket-management-system` and
> `academic-workflow-synchronization-system` — the same toolchain, the same layering, the same file naming, the same
> definition of done. Like the ticket sibling, it ships in **English only**; see
> [Differences from the reference projects](#differences-from-the-reference-projects) for what that costs and what it
> buys. The visual companion [`docs/project-overview.html`](project-overview.html) renders this same system as diagrams
> for a proposal or a presentation.

## How this works

- **You start each step.** Say _"start step 11"_ and only step 11 gets built. Nothing runs ahead of your command.
- **One step at a time.** Each step is self-contained and ends green; a step that turns out bigger than it looks gets
  split, not stretched, so the app is never left half-migrated between two of them.
- **Definition of done is the gate.** A step is not finished when the feature works — it is finished when every check in
  [Definition of done](#definition-of-done) passes. The checks are enforced, not remembered: Husky runs lint and format
  on every commit, commitlint on the message, and the build on every push.
- **Status at a glance is the source of truth for progress.** The table below is the one place that says what is built.
  Flipping a row from ⬜ to ✅ is the last act of a step, after its gates pass — so the ledger never runs ahead of the code.
- **The plan is not frozen.** Anything discovered mid-step that belongs elsewhere goes to the Backlog rather than
  quietly widening the current step.

## Status at a glance

| #              | Step                                            | Phase                                       | Status         |
| -------------- | ----------------------------------------------- | ------------------------------------------- | -------------- |
| [0](#step-0)   | Project scaffold                                | Foundation & tooling                        | ✅ Done        |
| [1](#step-1)   | Foundations                                     | Foundation & tooling                        | ✅ Done        |
| [2](#step-2)   | SEO, structured data & llms.txt                 | Discoverability                             | ✅ Done        |
| [3](#step-3)   | Data model                                      | Domain model & authentication               | ✅ Done        |
| [4](#step-4)   | Authentication                                  | Domain model & authentication               | ✅ Done        |
| [5](#step-5)   | Dashboard shell & RBAC                          | Dashboards & accounts                       | ✅ Done        |
| [6](#step-6)   | Accounts: registration, verification & approval | Dashboards & accounts                       | ✅ Done        |
| [7](#step-7)   | Vehicle records                                 | Vehicles, maintenance & booking             | ✅ Done        |
| [8](#step-8)   | Maintenance scheduler & reminders               | Vehicles, maintenance & booking             | ✅ Done        |
| [9](#step-9)   | Service booking                                 | Vehicles, maintenance & booking             | ✅ Done        |
| [10](#step-10) | Service-center operations                       | Vehicles, maintenance & booking             | ✅ Done        |
| [11](#step-11) | Marketplace: suppliers & products               | Marketplace, orders & billing               | ✅ Done        |
| [12](#step-12) | Orders & fulfillment                            | Marketplace, orders & billing               | ✅ Done        |
| [13](#step-13) | Invoices & payments                             | Marketplace, orders & billing               | ✅ Done        |
| [14](#step-14) | Messaging                                       | Messaging, notifications, reviews & reports | ✅ Done        |
| [15](#step-15) | Notifications                                   | Messaging, notifications, reviews & reports | ✅ Done        |
| [16](#step-16) | Reviews & ratings                               | Messaging, notifications, reviews & reports | ✅ Done        |
| [17](#step-17) | Reports & analytics                             | Messaging, notifications, reviews & reports | ✅ Done        |
| [18](#step-18) | Hardening                                       | Hardening, polish & release                 | ⬜ Not started |
| [19](#step-19) | Polish                                          | Hardening, polish & release                 | ⬜ Not started |
| [20](#step-20) | Testing & deployment                            | Hardening, polish & release                 | ⬜ Not started |

Steps 0–10 are ✅ Done — the foundation, the domain model and auth, the four dashboards, and the full
vehicles-maintenance-booking phase (vehicle records, the reminder cron, service booking and center operations, through
to durable records and SERVICE invoices) all land; steps 11–20 remain ⬜. The whole shape was decided before a line was
written — this is a from-scratch build guide — so steps run in order and the [Roadmap](#roadmap) groups them into the
phases a schedule can hang on. A row turns ✅ only when its step clears every gate in
[Definition of done](#definition-of-done) — the table is a ledger, not a wish.

## Roadmap

The eight phases the twenty-one steps group into, each with the deliverable it leaves behind.

| Phase                                       | Activity                                                                       | Deliverable                                                                        | Estimate | Steps |
| ------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | -------- | ----- |
| Foundation & tooling                        | Scaffold, tooling, typed config, design tokens, data-access primitives         | A running, lint-clean app with typed env, the Result/DTO layer and design tokens   | Week 1   | 0–1   |
| Discoverability                             | The SEO/crawler surface                                                        | robots.txt, sitemap, llms.txt and typed JSON-LD, indexing gated behind a flag      | Week 1   | 2     |
| Domain model & authentication               | Mongoose models + DTOs and the jose session/RBAC spine                         | Every collection modelled; a signed-in session that revokes within the hour        | Week 2   | 3–4   |
| Dashboards & accounts                       | Role-scoped shell, registration, verification and approval                     | Four dashboards; owners self-serve, centers and suppliers await admin verification | Week 2–3 | 5–6   |
| Vehicles, maintenance & booking             | Vehicle records, the reminder scheduler, service booking and center operations | Vehicle profiles, the maintenance cron, bookings and center fulfillment            | Week 3–4 | 7–10  |
| Marketplace, orders & billing               | Suppliers & products, orders, and invoices & payments                          | A verified-supplier catalogue, atomic-stock orders, invoices and payments          | Week 4–5 | 11–13 |
| Messaging, notifications, reviews & reports | Owner-center messaging, multi-channel notifications, reviews and analytics     | Conversations, the notification feed, ratings and role-scoped reports              | Week 5–6 | 14–17 |
| Hardening, polish & release                 | Security hardening, the finish pass, tests, CI and deployment                  | Rate limits, polish, the vitest suite, CI and a two-app PM2 deploy                 | Week 6+  | 18–20 |

## Decisions

Settled up front, because they shape every step below.

| Area                   | Choice                                                                                                  | Follows      |
| ---------------------- | ------------------------------------------------------------------------------------------------------- | ------------ |
| **Framework**          | Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, shadcn on Base UI                      | the siblings |
| **Data layer**         | zod schemas → services → DTO mappers → Result pattern → `actions.ts` server actions                     | the siblings |
| **Database**           | MongoDB + Mongoose, database name set in code via `dbName`, never read from the URI                     | the siblings |
| **Auth**               | Session JWT signed with `jose` (HS256) in an httpOnly cookie — no auth library, no pre-release deps     | the siblings |
| **Language**           | **English only.** No next-intl, no `[locale]` segment, no `l10n/`; copy is literal text in the JSX      | departure    |
| **Money**              | Integer minor units everywhere; every order line and invoice snapshots the price as sold                | the siblings |
| **Status transitions** | Booking and order status move only through action-based service methods behind a legal-transition guard | —            |
| **Rate limiting**      | DB-backed `ratelimits` collection, atomic `$inc` upsert, TTL-swept, fails open                          | the siblings |
| **Storage**            | GridFS bucket `uploads` for images, attachments and invoice PDFs; magic-byte checked, `sharp` → WebP    | the siblings |
| **Reminders**          | A second PM2 app runs the maintenance-reminder cron via `npm run send:reminders`                        | new domain   |
| **Runtime**            | `output: 'standalone'` when `VERCEL` is unset; PM2 web app on **port 3104**                             | the siblings |
| **Roles**              | `super-admin` · `admin` · `owner` · `service-center` · `supplier`                                       | —            |

Five of these carry weight the rest inherit, and each deserves its reasoning stated, because each will be questioned later.

**The session is verified but never trusted for authorization state.** `getSessionUser` verifies the `jose` signature —
`HS256` pinned, issuer and audience `vehicle-utilities`, expiry checked — and then re-loads the live `User` row on every
call, re-checking `isActive`, `isApproved` and that the role still matches the claim. Deactivating a supplier or revoking
an admin therefore takes effect within the hour, not whenever a token happens to expire. On a database outage it fails
**closed** for `admin` and `super-admin` and open for owners, service centers and suppliers — the privileged half of the
system would rather refuse than guess. The token proves who signed in; the database decides what they may still do. A
session you cannot revoke is a key you can never take back.

**Money is an integer, and the price is frozen where it is sold.** Every monetary field — a product price, an order
line, an invoice total, a payment amount — is an integer count of the currency's minor unit, and no float ever touches a
total. An `OrderItem` snapshots its `unitPrice` and subtotal _as sold_, so a supplier raising a price next week cannot
rewrite last week's receipt, and an `Invoice` totals the snapshot, not the live catalogue. Floating-point money is a bug
with a delay on it.

**Status is an action, never a field write.** A `ServiceRequest` and an `Order` each move through a fixed set of states,
and the only way to move one is to call the service method that names the transition — `accept` / `decline` / `start` /
`complete` / `cancel` for a booking, `confirm` / `pack` / `ship` / `deliver` for an order — each guarded by a
legal-transition table and scoped to the exact caller allowed to make it. Nobody writes `status = 'SHIPPED'` directly,
because a status you can assign is a status any half-finished handler can corrupt. A refused transition is data, not an
exception.

**The reminder worker is a second process, on purpose.** Maintenance reminders are time-driven, not request-driven: a
schedule falls **DUE** because a date passed or a mileage was crossed, and no one is necessarily looking at a page when
it does. So the sweep runs as its own PM2 application — `npm run send:reminders`, a `node-cron` entrypoint that advances
schedules UPCOMING → DUE → OVERDUE, enqueues a `Notification`, and stamps `lastNotifiedAt` so the same owner is never
reminded twice for the same slip. It shares the codebase and the database with the web app and nothing else. A reminder
that depends on someone visiting the site is not a reminder.

**Transactability is earned, not assumed.** An owner is usable the moment they verify their email; a service center or a
supplier self-registers but stays inert until an administrator verifies it. A booking can only be created against a
verified center and an order only against a verified supplier — enforced in the service, not merely hidden by the UI.
The platform vouches for who takes money on it, once and deliberately, and a UI that hides a button is not a permission
check.

## Differences from the reference projects

Everything not called out here is identical to the sibling repos — same conventions, same layering, same naming, same
hooks. Two things set this project apart: the language, inherited from one sibling, and the domain, which neither
sibling has.

**English only, inherited wholesale from the ticket sibling.** No `l10n/`, no next-intl, no `[locale]` segment:
`app/**` rather than `app/[locale]/**`, `<html lang="en">`, and `Link` / `redirect` / `usePathname` imported from
`next/link` and `next/navigation` directly, sorting into the **Next** import group. `proxy.ts` keeps its name and its
two jobs — the same-origin API perimeter and the `PROTECTED_SEGMENTS` route guard — with no locale negotiation. Metadata
loses `hreflang` and `og:locale`, the sitemap emits one entry per public route, and only Inter and Poppins load. Copy is
literal English in the component that renders it, until a second consumer earns the move to a `constants/*.const.ts`
file — which means **cspell now reads the app's copy**, because the dictionary runs over `.ts`/`.tsx` and that is where
the words live. Vehicle-domain vocabulary goes into `cspell.config.json` as it appears, never behind an inline disable.

**A maintenance-reminder cron worker the siblings do not have.** The siblings are entirely request-driven; VUSMS adds a
time-driven background process. `MaintenanceService.computeDue` advances a schedule UPCOMING → DUE → OVERDUE from its
`nextDueDate` and `nextDueMileage`, and the reminder worker sweeps the due ones on a cron, enqueues a `Notification`,
and records `lastNotifiedAt`. Concretely, that adds a **second PM2 application**, a `send:reminders` entrypoint,
`node-cron`, and a `cron_restart` line in `ecosystem.config.js` — the infrastructure that turns "the app is up" into
"the app is up and watching the calendar."

**A two-sided marketplace the siblings do not have.** VUSMS takes money in two directions and coordinates three parties.
Suppliers list `Product`s with a stock count; owners place an `Order` that decrements that stock **atomically** — an
oversell is impossible under concurrency — and snapshots each line's price. Order fulfillment walks PENDING → CONFIRMED
→ PACKED → SHIPPED → DELIVERED; a service booking walks its own PENDING → ACCEPTED → IN_PROGRESS → COMPLETED path; both
are backed by `SERVICE` and `ORDER` `Invoice`s, `Payment` records, and owner-authored `Review`s across service centers,
suppliers and products. That is **five roles instead of the siblings' four**, two verification gates before anyone is
transactable, and integer minor-unit money that is load-bearing from the first order, not a late billing bolt-on.

## Definition of done

A step is finished only when all of these hold:

- [ ] `npm run format:write` applied, `npm run format` clean
- [ ] `npm run lint` green — import order, cspell, canonical Tailwind classes, Prettier
- [ ] `npm run build` succeeds, including the TypeScript pass
- [ ] The affected screens render with no console errors, in light **and** dark
- [ ] New vehicle-domain vocabulary is added to `cspell.config.json`, never disabled inline
- [ ] New files are wired into their barrel `index.ts`
- [ ] Money is integer minor units; no float ever touches a total
- [ ] Booking and order status changed only through an action-based service method, never a raw status write
- [ ] No PII, token or storage key reaches a log line, a URL query string, or a DTO that did not name it
- [ ] Every entity returned to the UI went through its `xFromEntity` DTO mapper — no Mongoose document reaches a component
- [ ] This document's Status-at-a-glance row is flipped to ✅

---

## Steps

Each step follows the same shape — a goal that says why it sits where it does, a fenced file manifest of what it
delivers, the design decisions behind it with their reasons, and acceptance criteria naming the `verify:*` and `npm`
scripts that prove it done.

<a id="step-0"></a>

### Step 0 — Project scaffold ✅ Done

**Goal.** A running, lint-clean Next.js 16 App Router app on the house toolchain — exact-pinned dependencies, the
hook chain, the two PM2 apps and the empty folder skeleton — before a single feature, token or model exists. It sits
first because everything after it commits into this repo, and every one of those commits runs the hooks wired here.

**Deliverables.**

```
Toolchain   package.json (exact pins, no ^ or ~; the full scripts family) · tsconfig.json (strict) · next.config.ts
            postcss.config.mjs · eslint.config.mjs · .prettierrc · .prettierignore · cspell.config.json
            commitlint.config.mjs · vitest.config.mts · components.json · .gitignore · .env.example
Hooks       .husky/pre-commit (branch-name → lint → format) · .husky/commit-msg (commitlint) · .husky/pre-push (build)
Process     ecosystem.config.js — two PM2 apps: the web app on :3104, and the reminder cron (npm run send:reminders,
            via cron_restart)
Editor      .vscode/{extensions,launch}.json · .claude/launch.json
App shell   app/layout.tsx · app/page.tsx — a minimal root layout + placeholder so the empty app compiles
Skeleton    components/{owner,center,supplier,admin,auth,dashboard,marketplace,vehicles,scheduling,bookings,
            messages,shared,ui}/ · constants/ · env/ · models/ · lib/{api,auth,result,schemas,services,storage,
            mail,utils}/ · types/ · scripts/ — each with an empty barrel index.ts · proxy.ts (stub)
```

**Notes.**

- **Dependencies are pinned exact — no `^`, no `~`.** Two of them are deliberate down-pins the whole family shares:
  `typescript` at `6.0.3` because `typescript-eslint` will not load on TS 7, and `eslint` at `9.39.5` because
  `eslint-config-next` has no ESLint 10 support. Both are stated here so the next person does not "helpfully" bump them.
  **A version range is a decision you deferred to a stranger.**
- **The hooks are the point of step 0.** `pre-commit` checks the branch name against
  `^(feature/|bugfix/|release/|hotfix/)[a-z0-9-]+$` before it will even lint, then runs lint and format; `commit-msg`
  runs commitlint (Conventional Commits, `docs:` for docs); `pre-push` runs the build, which is the type check. **A gate
  you have to remember is a gate you will skip.**
- **`ecosystem.config.js` ships both apps from day one.** The web app binds port **3104** — the siblings took
  3101/3102/3103, so this one sits beside them without a collision — and a second PM2 app runs the maintenance-reminder
  worker via `npm run send:reminders` on a `cron_restart` schedule. The reminder worker is a first-class process, not a
  route somebody has to remember to poke.
- **The scripts family is declared whole now, even where the entrypoint is an empty stub.** `dev`/`build`/`build:linux`/
  `start`, `lint`/`format`, `test`, `smoke`, `seed:super-admin`, `seed:demo`, `send:reminders`, and the
  `verify:data-model|accounts|vehicles|scheduling|bookings|marketplace|orders|invoices|reports` set — all routed through
  `tsx --env-file-if-exists=.env.local` — so no later step has to reopen `package.json` to invent a script; it just fills
  the file the script already names.
- **The flat ESLint config carries every plugin the family lints with** — `eslint-config-next`, Prettier,
  `unused-imports`, `tailwind-canonical-classes` and `@cspell/eslint-plugin` — wired now so the first real file is held to
  exactly the same bar as the last one.
- **The skeleton is folders and barrels, not features.** `next.config.ts` sets `output: 'standalone'` only when `VERCEL`
  is unset; every library folder exposes an empty `index.ts` so later steps import through a barrel that already exists;
  `app/` ships just enough to compile. Design tokens and fonts land in [step 1](#step-1), the landing page in
  [step 2](#step-2).

**Acceptance criteria.** The step is done when:

- `npm run build` compiles the empty app, passes the strict TypeScript pass, and emits the standalone output when
  `VERCEL` is unset.
- `npm run lint` is green across the flat config — import order, `unused-imports`, canonical Tailwind classes, cspell and
  Prettier all run and pass.
- `npm run format` reports no changes.
- A commit from a branch that violates `^(feature/|bugfix/|release/|hotfix/)[a-z0-9-]+$` is refused by `pre-commit`, and
  a non-Conventional commit message is refused by `commit-msg`.
- `ecosystem.config.js` lists exactly two apps: the web app bound to port `3104`, and the reminder cron invoking
  `npm run send:reminders` via `cron_restart`.
- Every skeleton folder — `constants/`, `env/`, `models/`, each `lib/*`, `types/`, `scripts/` and each `components/*` —
  resolves through its own `index.ts` barrel.

---

<a id="step-1"></a>

### Step 1 — Foundations ✅ Done

**Goal.** Lay the load-bearing primitives every later step imports — validated environment, the constants that name the
product and its rules, the Mongoose singleton, the logger, the Result pattern, the API response helpers, the design
tokens and the money utilities — so no feature step ever invents its own error shape, reads `process.env` directly, or
does arithmetic on a float that is meant to be money. It sits second because steps 2 onward all reach through it.

**Deliverables.**

```
Env         env/server.ts (@t3-oss/env-nextjs + zod; imported by next.config.ts so bad env fails the build) ·
            env/client.ts (NEXT_PUBLIC_* only) · env/index.ts
Constants   constants/app-data.const.ts (NAME=VUSMS · tagline "Keep every vehicle on the road." · currency) ·
            constants/roles.const.ts (USER_ROLES · ROLE_HOME · ADMIN_AREA_ROLES) ·
            constants/routes.const.ts (ROUTES · PROTECTED_SEGMENTS) · constants/auth.const.ts (vusms.session shape) ·
            constants/rate-limit.const.ts · constants/storage.const.ts · constants/datetime.const.ts (timezone) ·
            constants/database.const.ts (dbName) · constants/money.const.ts · constants/codes.const.ts ·
            constants/codes-common.const.ts · constants/index.ts
Result      lib/result/{single-result,list-result,empty-result,error-dto,message-dto,index}.ts
API         lib/api/responses/{with-ok,with-bad-request,with-unauthorized,with-forbidden,with-not-found,
            with-too-many-requests,with-payload-too-large}.ts · lib/api/same-origin.guard.ts ·
            lib/api/content-length.guard.ts · lib/api/index.ts
Data        lib/mongodb.ts (globalThis-cached mongoose singleton; dbName from constants) ·
            lib/logger.ts (pino, pretty in dev / JSON in prod, token + PII scrub)
Utils       lib/utils/money.utils.ts + lib/utils/money.utils.test.ts · lib/utils/class-name.utils.ts · lib/utils/index.ts
Design      app/globals.css (light default + full .dark block; primary indigo, role accents violet/blue/teal/amber) ·
            app/layout.tsx (Inter body + Poppins headings via next/font)
```

**Notes.**

- **Environment is read through the typed `env` object, never `process.env`.** `env/server.ts` is imported by
  `next.config.ts`, so an invalid or missing variable fails the build rather than the first request — empty string is
  treated as absent, `MONGODB_URI` and `AUTH_SECRET` (min 32 chars) are required, and `APP_BASE_URL`, `ROBOTS_ENABLED`,
  `TRUSTED_PROXY`, `STORAGE_CAP_BYTES` and the rest carry defaults. **A config error at boot is a config error you found.**
- **Services return values, not exceptions.** `SingleResult<T>` / `ListResult<T>` / `EmptyResult` all carry
  `{ success, result, errors, messages }`; a business refusal is a failure result, and only genuinely exceptional things
  throw. **A refused action is data, not an exception.**
- **Money is integer minor units end to end.** `money.const.ts` pins the currency and its minor-unit scale,
  `money.utils.ts` parses a typed decimal into an integer once at the boundary and formats it back for display, and it
  ships with a unit test because it is the one primitive every invoice, order and payment total leans on. **Floating-point
  money is a bug with a delay on it.**
- **The error-code registry is fixed now, filled later.** `codes.const.ts` sets the 5-digit
  `[layer][feature][sequence]` scheme — layers `1` Database, `2` Validation, `3` Business, `5` Auth; features `0` Common,
  `1` Users, `2` Vehicles, `3` Scheduling, `4` Bookings, `5` Marketplace, `6` Orders, `7` Billing — and each feature adds
  its own `codes-{feature}.const.ts` beside the service that raises it, not up front for services that do not exist yet.
- **The logger never sees a secret.** `lib/logger.ts` is pino — pretty in development, JSON in production — with token and
  PII scrubbing, so a password, a verification or reset token, or an email address is never a log field. An id is fine; a
  credential is not. Anything in the `lib/utils` barrel must also be safe in a client bundle, so `proxy.ts` and the models
  import their constant modules directly rather than through it.
- **Every dashboard gets its color before its screens exist.** `app/globals.css` defines the full token set in a light
  default and a `.dark` block — `primary` an indigo, plus the four role accents `accent-violet` (admin), `accent-blue`
  (owner), `accent-teal` (service-center) and `accent-amber` (supplier) — with Inter on the body and Poppins on headings
  through `next/font`. `PROTECTED_SEGMENTS` is written here as the single source both the route guard and the robots
  disallow list will read, so the two lists can never drift apart.

**Acceptance criteria.** The step is done when:

- `npm run build` fails before compilation on a bad env — a non-URL `APP_BASE_URL`, or an `AUTH_SECRET` shorter than 32
  characters — printing the offending path; and a clean build with `MONGODB_URI` set and a ≥32-char `AUTH_SECRET`
  succeeds, because every other variable falls back to its default.
- `app/globals.css` resolves every token under both the light default and the `.dark` class, and all four role accents
  (`accent-violet`/`accent-blue`/`accent-teal`/`accent-amber`) are defined in both.
- `npm run test` runs the `money.utils` suite green — `toMinorUnits` / `formatMoney` round-trip through integer
  arithmetic only, with no float in the path.
- `lib/mongodb.ts` opens a single `globalThis`-cached Mongoose connection whose database name comes from
  `constants/database.const.ts`, not from `MONGODB_URI`.
- `lib/logger.ts` emits no password, token or email field, proven by its scrub configuration and test.
- `npm run lint` and `npm run format` are green, and every new module resolves through its barrel `index.ts`.

---

<a id="step-2"></a>

### Step 2 — SEO, structured data and llms.txt ✅ Done

**Goal.** The crawler and machine-readable surface, all of it derived from a single validated `APP_BASE_URL`.
This step makes the public landing page legible to search engines, social cards and LLM crawlers, and — just
as deliberately — makes sure every dashboard is never indexed. It sits immediately after the foundations
because it is the first consumer of the validated `env` module, and before the data model and auth because it
concerns only the public shell those later steps hang features off.

**Deliverables.**

```
app/robots.ts                  Disallow: / unless ROBOTS_ENABLED; always emits the Sitemap: line
app/sitemap.ts                 absolute URLs from APP_BASE_URL, one entry per public route
app/opengraph-image.tsx        1200×630 social card via next/og ImageResponse
app/llms.txt/route.ts          short index for LLM crawlers (llmstxt.org convention), 1h cache
app/llms-full.txt/route.ts     the long form — every landing section as markdown, 1h cache
app/layout.tsx                 metadataBase from APP_BASE_URL, canonical, static metadata, noindex gate
components/shared/json-ld.tsx  renders the @graph, escaped, ships no client JavaScript
constants/json-ld.const.ts     @graph builder — Organization · WebSite · SoftwareApplication
constants/seo.const.ts         keywords, public routes, sitemap priority tiers
constants/routes.const.ts      ROUTES, PROTECTED_SEGMENTS (the single source for guard + Disallow)
env/server.ts                  reads ROBOTS_ENABLED (declared in step 1, first consumed here)
lib/utils/llms.utils.ts        builds the llms.txt bodies from the same constants the page renders
lib/utils/url.utils.ts         absolute-URL helpers over APP_BASE_URL
```

**Notes.**

- **Indexing is off unless a deploy opts in.** `ROBOTS_ENABLED` defaults to `false`, which makes `robots.txt`
  emit `Disallow: /` _and_ the page metadata emit `noindex, nofollow` — two independent signals, because
  getting a staging site back out of a search index is far more work than setting one variable.
- **`PROTECTED_SEGMENTS` is the single source for both the route guard and the `Disallow` list.** The guard in
  [step 5](#step-5) and the crawler exclusion here read the same array in `constants/routes.const.ts`. Two
  copies of that list is exactly how a route ends up guarded but crawled, or crawled but unguarded.
- **The JSON-LD is escaped, because a JSON-LD sink is an injection sink.** `json-ld.tsx` serializes the typed
  `@graph` into a `<script type="application/ld+json">` with the closing-tag sequence escaped, from a server
  component that ships no client JavaScript. Structured data is still attacker-adjacent the moment any node is
  derived from stored text.
- **The graph is typed with `schema-dts`.** `Organization → WebSite → SoftwareApplication`, cross-linked by
  `@id`, so a node or property outside the schema.org vocabulary fails the build instead of failing a validator
  after deploy. `constants/json-ld.const.ts` exports a **builder**, not a static object — the base URL is
  server-only env and the constants barrel is imported by client components.
- **The sitemap enumerates public routes explicitly, never from the filesystem.** `SEO.PUBLIC_ROUTES` lists
  what may be crawled; the marketplace browse and every dashboard segment are absent by construction. A
  self-discovering sitemap publishes the first URL somebody forgot to think about.
- Adds `schema-dts`; `next/og` ships with Next.

**Acceptance criteria.**

The step is done when:

- `/robots.txt` serves `User-Agent: *` with `Disallow: /` and the `Sitemap:` line while `ROBOTS_ENABLED` is
  unset, and flips to `Allow: /` with the private segments disallowed when it is `true`.
- `/sitemap.xml` serves absolute URLs built from `APP_BASE_URL` through `metadataBase`, one entry per route in
  `SEO.PUBLIC_ROUTES`.
- `/llms.txt` and `/llms-full.txt` serve `text/plain` with a one-hour cache header, both built from the same
  constants the landing page renders so they cannot drift from the UI.
- `/opengraph-image` serves `image/png` at 1200×630, and the rendered `<head>` carries an absolute canonical,
  the full `og:` set and `twitter:card` `summary_large_image`.
- The JSON-LD validates as a `schema-dts`-typed `Organization → WebSite → SoftwareApplication` graph with every
  `@id` cross-link resolving inside the document; a node outside the vocabulary fails `npm run build`.
- Every page carries `noindex, nofollow` until `ROBOTS_ENABLED` is `true`, so a deployment that has not opted in
  says "do not index" twice.
- `npm run lint`, `npm run format` and `npm run build` are green, and the build prerenders the new SEO routes.

---

<a id="step-3"></a>

### Step 3 — Data model ✅ Done

**Goal.** Every Mongoose model, its indexes and its DTO mapper — the seventeen documents the whole platform
reads and writes, from the `User` that authentication mints a session from to the `Order`, `Invoice` and
`Payment` the marketplace settles. It sits before [step 4](#step-4) because authentication reads the live
`User` row on every request, and before every feature step because each one selects from a collection defined
here.

**Why this matters.** The data model is where the invariants live — not the UI, and not even the services that
guard them. A single super-admin, a `vin` and a `registrationNo` and a `sku` that cannot collide, money that is
always an integer of the currency's minor unit, a booking or order status that only a legal-transition guard
may advance: each of these is cheaper to guarantee in the schema than to re-check in every caller, and a wrong
shape here is not a code change later but a migration run under live orders. Get the shapes and the indexes
right once and every step downstream inherits the guarantee; get them wrong and every step downstream inherits
the bug. **The cheapest place to enforce a rule is the one the next caller cannot forget.**

**Deliverables.**

```
Models   models/user.model.ts                     name · email (unique, lowercased) · password (select:false, bcrypt salt 12)
                                                   role · isApproved · isActive · emailVerified · *TokenHash (select:false) · phone · avatarStorageKey
         models/service-center-profile.model.ts   user (1:1) · centerName · address · city · geo · servicesOffered[] · operatingHours · rating* · isVerified
         models/supplier-profile.model.ts         user (1:1) · businessName · address · city · phone · rating* · isVerified
         models/vehicle.model.ts                  owner · make · model · year · vin (unique) · registrationNo (unique) · fuelType · transmission · currentMileage
         models/maintenance-schedule.model.ts     vehicle · serviceType · intervalMonths? · intervalMileage? · nextDueDate · nextDueMileage · status · lastNotifiedAt?
         models/maintenance-record.model.ts       vehicle · serviceRequest? · serviceCenter? · serviceType · mileageAtService · cost (minor units) · performedOn
         models/service-request.model.ts          vehicle · owner · serviceCenter · serviceType · priority · status · preferredDate · scheduledDate? · estimatedCost? · finalCost?
         models/product.model.ts                  supplier · name · category · sku (unique) · price (minor units) · stockQuantity · isActive
         models/order.model.ts                    buyer · supplier · status · subtotal · shippingFee · tax · totalAmount (all minor units) · shippingAddress · paymentStatus · placedAt
         models/order-item.model.ts               order · product · quantity · unitPrice (minor units) · subtotal (minor units)
         models/invoice.model.ts                  type (SERVICE|ORDER) · reference · owner · issuedBy · subtotal · tax · total (minor units) · status · issuedAt · dueDate · paidAt?
         models/payment.model.ts                  invoice · amount (minor units) · method · status · transactionRef? · paidAt?
         models/conversation.model.ts             owner · serviceCenter · serviceRequest? · lastMessageAt
         models/message.model.ts                  conversation · sender · body · attachmentStorageKey? · readAt?
         models/notification.model.ts             user · type · title · body · channel · data · isRead
         models/review.model.ts                   author · targetType · targetId · rating (1–5) · comment?
         models/rate-limit.model.ts               key (unique) · hits · windowStartedAt · expiresAt — TTL index, the one model with no timestamps
         models/index.ts                          barrel; every model guarded with mongoose.models.X ?? mongoose.model(...)
DTOs     types/user.dto.ts                        UserDto + userFromEntity() — strips password, token hashes, storage keys
         types/vehicle.dto.ts · maintenance-schedule.dto.ts · maintenance-record.dto.ts · service-request.dto.ts
         types/service-center.dto.ts · supplier.dto.ts · product.dto.ts · order.dto.ts (+ OrderItemDto) · invoice.dto.ts · payment.dto.ts
         types/conversation.dto.ts · message.dto.ts · notification.dto.ts · review.dto.ts
         types/session-user.ts                    SessionUser — userId · email · name · role · isApproved
Enums    constants/roles.const.ts · vehicle.const.ts · scheduling.const.ts · marketplace.const.ts · billing.const.ts
                                                   USER_ROLES, fuel/transmission, schedule + request status, product category, order/invoice/payment enums
Schemas  lib/schemas/object-id.schema.ts          the shared objectIdField; per-entity create/update schemas land with their service steps
Verify   scripts/verify-data-model.ts             live-DB harness: indexes, uniqueness, TTL, mapper leak-checks; self-cleaning
```

**Notes.**

- **No Mongoose document reaches the UI.** Every entity has an explicit `xFromEntity` mapper in `types/*.dto.ts`
  that names each field it exposes and never spreads the document — so `password`, the `*TokenHash` fields,
  every `*StorageKey`, `_id` and `__v` cannot leak by being forgotten. **The database row is not the API.**
- **Money is an integer of the currency's minor unit in every schema that names an amount.** `cost`, `price`,
  `subtotal`, `shippingFee`, `tax`, `totalAmount`, `unitPrice`, `total` and `amount` are all integer `Number`s;
  no float ever touches a monetary field, because the first order that totals `0.1 + 0.2` is the one that
  reconciles wrong on a customer's invoice.
- **Uniqueness is an index, not a service check.** Exactly one super-admin is a partial unique index on
  `{ role }`; a unique email, a unique `vin`, a unique `registrationNo` and a unique `sku` are unique indexes;
  each profile is `1:1` by a unique `user` index. A check in a service is a rule the next caller can forget; an
  index is not.
- **Indexes encode the queries the features rely on**, and each carries the query it serves in a comment:
  `{ status, nextDueDate }` for the reminder sweep in [step 8](#step-8), `{ serviceCenter, status }` and
  `{ owner, status }` for the booking queues, `{ category }` / `{ supplier }` / `{ sku }` for the marketplace
  browse, `{ vehicle, performedOn: -1 }` for a vehicle's service history, `{ targetType, targetId }` for
  reviews, and a TTL index on `RateLimit.expiresAt` (`expireAfterSeconds: 0`) that sweeps the counter
  collection with no cron of its own.
- **Passwords and tokens are hashed at rest.** The field is `password`, not `passwordHash`, hashed by a
  `pre('save')` hook at bcrypt cost 12 with `select: false`, so every write path — including the
  `seed:super-admin` script — hashes, and `comparePassword` is the only check. The email-verification,
  pending-email and password-reset tokens are stored only as their SHA-256 hashes; the raw 32-byte token is
  emailed once and never persisted, because a token you store is a token you can leak.
- **The data layer runs ahead of the service layer on purpose.** Seventeen documents land here with their
  mappers and indexes; their services arrive in the steps that own the behavior — vehicles in
  [step 7](#step-7), scheduling in [step 8](#step-8), bookings in steps [9](#step-9)–[10](#step-10), the
  marketplace in [step 11](#step-11), orders in [step 12](#step-12), billing in [step 13](#step-13). Status is a
  plain enum in the schema; only a legal-transition guard in the service may advance it, never a raw status
  write. Adds `mongoose` and `bcryptjs`; `MONGODB_URI` becomes **required** here — the first step that reads the
  database.

**Acceptance criteria.**

The step is done when:

- `npm run verify:data-model` passes against a live MongoDB: the partial unique index refuses a second
  `super-admin`, the unique `email` / `vin` / `registrationNo` / `sku` indexes refuse duplicates, the two `1:1`
  profile indexes refuse a second profile per user, and the TTL index on `RateLimit.expiresAt` is present.
- All seventeen models register their declared indexes — `verify:data-model` reads `collection.indexes()` and
  asserts each compound, unique and partial index exists, then cleans up after itself.
- Every DTO mapper is proven to leak no secret: the harness asserts `'password' in userFromEntity(...)` is
  `false`, that no mapper output carries a `*TokenHash`, a `*StorageKey`, `_id` or `__v`, and the DTO types name
  none of them.
- Every monetary field round-trips as an integer of minor units, and no schema path is typed as a float.
- `npm run lint`, `npx tsc --noEmit` and `npm run build` are green, and `models/index.ts` and the `types` barrel
  wire every new model and DTO.

---

<a id="step-4"></a>

### Step 4 — Authentication ✅ Done

**Goal.** The session layer and the guards every later screen leans on: `jose` mints and verifies a signed token that
carries the role, the middleware decides whether a request may reach a protected segment at all, and the guards decide
which role a page serves. It sits here — before any dashboard, account flow or business screen — because everything
built after it assumes a caller whose identity and role can already be trusted.

**Why this matters.** Authentication is the one spine the whole app hangs off. Get the token verification, the
revocation model and the fail-closed decision right once, here, and no later step re-argues them; get any of the three
wrong and every guard downstream inherits the hole. A session is simultaneously the credential a caller presents and
the lever an admin pulls to take it back — so the design has to make both cheap and make revocation land inside the
hour, not whenever a token happens to expire.

**Deliverables.**

```
Session      lib/auth/session.ts            createSessionToken · verifySessionToken — jose, HS256 pinned, iss/aud/exp verified, payload zod-parsed
             lib/auth/session-cookie.ts     setSessionCookie · clearSessionCookie — httpOnly, sameSite lax, secure in prod
             lib/auth/get-session-user.ts   getSessionUser — verify, then re-load the live User row every call; React cache() per request
             lib/auth/guards.ts             requireSession · requireRole · requireAdminArea · gateAdminArea (Result-shaped refusal)
             lib/auth/index.ts              barrel, in dependency order
Perimeter    proxy.ts                       Next 16 middleware — same-origin /api gate, then a PROTECTED_SEGMENTS token check
Constants    constants/auth.const.ts        SESSION cookie vusms.session · httpOnly · sameSite lax · secure in prod · MAX_AGE 1h · iss/aud vehicle-utilities
             constants/routes.const.ts      ROLE_HOME · PROTECTED_SEGMENTS = [/owner, /center, /supplier, /admin, /profile]
Env          env/server.ts                  AUTH_SECRET becomes required (min 32 chars) — the key the session JWT is signed with
Test         lib/auth/session.test.ts       vitest — round-trip · tampered · wrong-secret · wrong-audience · expired · unknown-role
```

**Notes.**

- **The token is verified, then distrusted.** `getSessionUser` checks the signature in `jose`, then loads the live
  `User` row and re-reads `isActive`, `isApproved` and the role on every call — so deactivating a supplier or revoking
  an admin takes effect on their next request, not at token expiry. It is wrapped in React `cache()` so a page that
  guards twice pays for one query, and on a database outage it **fails closed for `admin`/`super-admin`** and open for
  `owner`/`service-center`/`supplier`. When in doubt about power, deny.
- **The verifier pins its algorithm.** `verifySessionToken` passes an `algorithms: ['HS256']` allow-list and a fixed
  issuer/audience (`vehicle-utilities`), then re-parses the payload with zod before anyone reads a claim. A verifier
  that accepts whatever `alg` the token names — `none` included — validates its own forgeries. **An unpinned verifier
  is a forgery oracle.**
- **The proxy answers "is there a session"; the page answers "is it the right one".** `proxy.ts` does signature-only
  verification at the edge — there is no database in the middleware runtime — and only for `PROTECTED_SEGMENTS`; a
  signed-out caller is redirected to `/sign-in?next=<path>`. Each page then calls `requireRole(...)` for the exact role
  it serves, and a wrong-area session is sent to `/unauthorized`. Two different questions deserve two different answers.
- **The cookie is hardened and short.** `vusms.session` is `httpOnly` (no script reads it), `sameSite: 'lax'`, `secure`
  in production, and lives one hour. The short life is the point: a stolen cookie expires on its own, and the live
  re-check revokes it sooner. A long-lived session is a key you cannot take back.
- **`AUTH_SECRET` becomes required and must be at least 32 characters**, validated in `env/server.ts` so a short or
  missing secret **fails the build**, not a request at 3 a.m. `gateAdminArea` hands server actions the same refusal the
  page guards give routes, Result-shaped, so an action never has to trust that a screen already checked.

**Acceptance criteria.** The step is done when:

- `npm run test` runs the session suite green: `verifySessionToken` returns `null` for a non-JWT, a wrong secret, a
  tampered payload, a wrong audience and an expired token, and round-trips a valid one — the checks in
  `lib/auth/session.test.ts`.
- `npm run build` compiles, passes the TypeScript pass and registers the proxy middleware; `env/server.ts` now rejects
  a build whose `AUTH_SECRET` is missing or under 32 characters.
- A request without `vusms.session` into any `PROTECTED_SEGMENTS` path is redirected to `/sign-in?next=<path>`, and a
  request carrying a valid cookie passes the edge check and reaches the page.
- `getSessionUser` re-loads the live user row on every call and fails closed for `admin`/`super-admin` on a DB error;
  `requireRole`/`requireAdminArea` refuse a wrong-area session toward `/unauthorized` (the page itself lands in
  [step 5](#step-5)), and `gateAdminArea` returns the same refusal to a server action.
- `npm run lint` and `npm run format` are clean.

---

<a id="step-5"></a>

### Step 5 — Dashboard shell & RBAC ✅ Done

**Goal.** One dashboard shell, four role areas, and the access rules that decide who sees which — settled in one place
instead of re-argued on every screen. With authentication proven in [step 4](#step-4), this gives each of the five
roles a home to land on and a chrome to navigate, so every feature step after it drops its screens into an area that
already exists.

**Deliverables.**

```
Layout       app/(dashboard)/layout.tsx                requireSession() + builds the shell; metadata noindex
             app/(dashboard)/loading.tsx · error.tsx · not-found.tsx
             app/(dashboard)/owner/layout.tsx · center/layout.tsx · supplier/layout.tsx · admin/layout.tsx
Homes        app/(dashboard)/owner/page.tsx · center/page.tsx · supplier/page.tsx · admin/page.tsx   role landings
Unauthorized app/unauthorized/page.tsx                 the centred 403 a wrong-area session lands on
Chrome       components/dashboard/                      dashboard-sidebar · dashboard-topbar · dashboard-nav · dashboard-mobile-nav · account-menu · role-home · index.ts
Nav model    lib/utils/navigation.utils.ts             resolveNavModel(role) — visibility decided here, not at render
             lib/utils/role.utils.ts                   roleAccentClassName(role) · resolveRoleLabel(role)
Routes       constants/routes.const.ts                 the dashboard routes, one segment per role; PROTECTED_SEGMENTS now populated
```

**Notes.**

- **One shell, parameterized by role — not four copies.** The sidebar, topbar and breadcrumb are one component tree fed
  a nav model; the role only changes the model and the accent. Four hand-maintained copies drift the first week someone
  adds a nav item to three of them. **One shell parameterized cannot drift; four copies always will.**
- **Guard in the layout, re-guard on the page.** `app/(dashboard)/layout.tsx` calls `requireSession()` so a new route
  under it is protected before anyone wires a link; each page still calls `requireRole(...)` (or `requireAdminArea()`)
  naming the precise role it serves. Every dashboard segment is in `PROTECTED_SEGMENTS`, so the middleware gate and the
  layout guard read one list and cannot disagree.
- **The accent is a role signal, not decoration.** `roleAccentClassName(role)` tints the badge and sidebar accent —
  blue for owner, teal for service-center, amber for supplier, violet for admin, with super-admin borrowing admin's
  violet — so anyone glancing at a shared screen can see whose session is open. It is applied as text/icon colour,
  contrast-verified as text-on-card; the active nav state uses the `sidebar-accent` pair, never the role accent.
- **Visibility is decided in the nav model, not at render.** `resolveNavModel(role)` returns only the sections and items
  a role may reach; an item it cannot reach is absent from the model, not rendered-then-disabled. The sidebar, the
  mobile drawer and the breadcrumb all read that one model, so a link cannot appear in one and vanish from another.
- **A `'use server'` action is imported relatively, never through a barrel.** `account-menu.tsx` pulls `signOutAction`
  by relative path; re-exporting a server-action module through `components/*/index.ts` drags every action into the
  client graph. Route-local components live in `_components/`.
- **The role homes are thin on purpose.** Each is a short guarded page with a title and a capability list; the real
  widgets — an owner's due schedules, a center's incoming requests, a supplier's low stock — arrive with the feature
  steps that have data to show, not here.

**Acceptance criteria.** The step is done when:

- `npm run build` prerenders `/owner`, `/center`, `/supplier` and `/admin` as dynamic, session-guarded routes, each
  carrying `noindex` from the shell's metadata, and `PROTECTED_SEGMENTS` now feeds both `proxy.ts` and the robots
  `Disallow` from the one list.
- `ROLE_HOME` is `as const satisfies Record<UserRole, string>`, so a role without a home is a compile error, and a
  fresh sign-in lands each role on its own area — super-admin and admin both on `/admin`.
- The shell renders in light **and** dark with no console errors, and a signed-in user hitting an area their role does
  not own is redirected to `/unauthorized` (403).
- `npm run lint`, `npx tsc --noEmit`, `npm run test` and `npm run build` are all green.

---

<a id="step-6"></a>

### Step 6 — Accounts: registration, verification & approval ✅ Done

**Goal.** Self-service identity, end to end: an owner, a service center or a supplier registers themselves, proves their
email, and — for the two business roles — waits for an admin to vouch for the profile before they can transact. This is
the step that turns the session machinery of [step 4](#step-4) into real accounts and gives the admin area of
[step 5](#step-5) the two screens it governs them from.

**Why this matters.** This is where the platform first accepts an identity it did not create and decides what that
identity may do. The decision is deliberately two-staged: an owner is usable the moment they verify their email, but a
service center or supplier can sign in, fill out a profile, and still not sell a thing until an admin verifies the
business behind it. Every token minted here is a bearer secret, every sign-in is an oracle an attacker will probe for
which accounts exist, and every rate budget is the difference between a form and a brute-force endpoint — so the
hashing, the timing and the limits are load-bearing, not polish.

**Deliverables.**

```
Services     lib/services/auth.service.ts       verifyCredentials · register (owner|service-center|supplier) · verifyEmail · confirmEmailChange · reissueVerification · issuePasswordReset · resetPassword
             lib/services/user.service.ts       list · getById · create · setApproval · setActive · verifyProfile (center/supplier) · delete
Helpers      lib/services/helpers/token.hash.ts        sha256(token) — hash at rest, compare by hash
             lib/services/helpers/rate-limit.guard.ts  atomic $inc upsert on the ratelimits collection, fails open
Mail         lib/mail/mailer.ts · lib/mail/templates/*  nodemailer when SMTP_HOST is set, log-fallback otherwise
Schemas      lib/schemas/auth-sign-in.schema.ts · auth-register-*.schema.ts · auth-reset.schema.ts · auth-verify.schema.ts
Actions      components/auth/actions.ts                signInAction · signOutAction
             components/auth/registration/actions.ts   registerOwnerAction · registerServiceCenterAction · registerSupplierAction · verifyEmailAction · reissueVerificationAction · requestPasswordResetAction · resetPasswordAction · confirmEmailChangeAction
Auth pages   app/(auth)/sign-in/page.tsx
             app/(auth)/register/{page,owner,service-center,supplier}/page.tsx
             app/(auth)/registration-received/page.tsx
             app/(auth)/verify-email/page.tsx · verify-email-change/page.tsx
             app/(auth)/forgot-password/page.tsx · reset-password/page.tsx
Admin pages  app/(dashboard)/admin/users/page.tsx           govern every account
             app/(dashboard)/admin/verifications/page.tsx   approve service centers & suppliers
Components   components/auth/ · components/admin/users/ · components/admin/verifications/   forms · tables · dialogs
Constants    constants/rate-limit.const.ts (SIGN_IN · REGISTER · RESEND · PASSWORD_RESET) · constants/auth.const.ts (token TTL 24h · resend cooldown 2m) · constants/codes.const.ts (feature 1, Users)
Script       scripts/verify-accounts.ts        manual integration harness — npm run verify:accounts
```

**Notes.**

- **The platform stores hashes of tokens, never tokens.** Verification, email-change and password-reset tokens are 32
  random bytes, kept only as their SHA-256 hash (`token.hash`), single-use, valid 24 hours, with a 2-minute resend
  cooldown. A token that leaks from a database backup a year from now unlocks nothing, because the row never held the
  token — only its fingerprint. **A stored secret is a breach waiting for a backup.**
- **A wrong email and a wrong password cost the same and say the same.** `verifyCredentials` runs bcrypt even when no
  account matched — against a constant `ABSENT_PASSWORD_HASH` — and discloses whether an account is unverified or
  unapproved only _after_ the password check, returning one `INVALID_CREDENTIALS` for both cases and never logging the
  identifier. An error that tells a stranger which half they got wrong is a user-enumeration endpoint with good manners.
- **Signing in is not the same as being allowed to transact.** An owner is approved on email verification; a
  service-center or supplier account is created on verification but stays un-transactable until an admin flips
  `isVerified` on its profile — and that gate is enforced in the services (`ProductService` refuses a listing,
  `ServiceRequestService` refuses a booking), never merely hidden in the UI. **A business that can sign in is not a
  business that can sell.**
- **The limits are DB-backed and fail open.** `SIGN_IN` is 5 per 15 minutes per identifier, `REGISTER` 3 per hour,
  `RESEND` and `PASSWORD_RESET` 5 per hour; `rate-limit.guard` is an atomic `$inc` upsert on the TTL-swept `ratelimits`
  collection and answers `Retry-After: 60`. It fails _open_ by design — a limiter that bricks sign-in when its own
  store hiccups is a self-inflicted outage — because throttling is a speed bump, not the authentication.
- **Role is chosen once, at registration, and never edited.** A caller picks owner, service-center or supplier when
  they register; nobody changes their own role or access afterward; the single super-admin is seeded, never created
  through a screen, and only a super-admin may mint an admin. Accounts are deactivated, not deleted, by default.
- **Mail is a seam, not a dependency.** `lib/mail` sends through nodemailer when `SMTP_HOST` is configured and writes to
  the log otherwise, so a clean clone "sends" every verification link to the console and the whole flow is testable
  with no SMTP server in sight.

**Acceptance criteria.** The step is done when:

- `npm run verify:accounts` passes against a live MongoDB: it registers an owner, a service center and a supplier,
  verifies each email, and asserts the owner is immediately usable while the center and supplier can sign in but are
  refused every transactional action until an admin verifies them — then cleans up after itself.
- A verification, email-change or password-reset token is refused the second time it is presented and after 24 hours,
  and a resend requested inside the 2-minute cooldown is refused.
- An unverified supplier cannot list a product and an unverified service center cannot accept a booking — both refusals
  come from the service with a `constants/codes.const.ts` business code, not from a hidden button.
- The rate budgets hold: a 6th sign-in for one identifier inside 15 minutes and a 4th registration inside an hour are
  refused with `Retry-After: 60`.
- `npm run lint`, `npx tsc --noEmit`, `npm run test` and `npm run build` are green.

---

<a id="step-7"></a>

### Step 7 - Vehicle records ✅ Done

**Goal.** The owner-facing vehicle registry — the spine every other owner feature hangs off. An owner registers a car,
edits it, retires it, and attaches a photo; schedules, maintenance records, bookings and invoices all point back at the
`Vehicle` this step writes. It sits here, first of the owner features, because there is nothing to schedule, book or
invoice against until a vehicle exists to name.

**Deliverables.**

```
lib/services/vehicle.service.ts            list · getById · create · update · remove — owner-scoped, unique vin/registrationNo
lib/schemas/vehicle-create.schema.ts · vehicle-update.schema.ts · vehicle-filters.schema.ts
types/vehicle.dto.ts                       VehicleDto + vehicleFromEntity mapper wired into the owner read path (storageKey never mapped)
lib/storage/                               gridfs.ts (bucket "uploads") · storage.guard.ts (cap check, fails open)
                                           image.ts (magic-byte verify · sharp → WebP, limitInputPixels) · index.ts
app/api/uploads/route.ts                   POST an image — role-gated, same-origin + content-length guarded
app/api/uploads/[id]/view/route.ts         access-checked stream, X-Content-Type-Options: nosniff
app/api/uploads/[id]/download/route.ts     access-checked attachment, nosniff
lib/api/responses/with-payload-too-large.ts · lib/api/content-length.guard.ts
app/(dashboard)/owner/vehicles/page.tsx · page-search-params.ts · loading.tsx · new/page.tsx · [vehicleId]/page.tsx
components/vehicles/                        vehicles-screen · vehicles-table · vehicles-table-row · vehicles-filters · vehicles-empty
                                           vehicle-create.form · vehicle-edit.dialog · vehicle-confirm.dialog · vehicle-image.field
                                           vehicle-detail · vehicles.types.ts · actions.ts · index.ts
constants/codes-vehicles.const.ts          feature digit 2
scripts/verify-vehicles.ts                 verify:vehicles — unique constraints, owner scoping, cascade/refuse, DTO leak check
```

**Notes.**

- **A vehicle belongs to exactly one owner, and every read enforces it.** `VehicleService` takes the `requester` and scopes
  every query by `owner`; `getById` on a car the caller does not own returns a `NOT_VEHICLE_OWNER` refusal, not a silent
  empty row. The owner is set from the session at `create` and is never a form field — an ownership you accept from the
  client is an ownership you gave away.
- **`vin` and `registrationNo` are unique indexes, not service pre-checks.** A duplicate is refused by the database on the
  write, and the `11000` duplicate-key error is caught and mapped to a field-scoped `VIN_TAKEN` / `REGISTRATION_TAKEN`. A
  check in a service is a rule the next concurrent caller can interleave; **a VIN is the vehicle's fingerprint, and two rows
  with one VIN is two truths about one car.**
- **`currentMileage` is an integer, on purpose, because the scheduler reads it.** [step 8](#step-8) compares
  `intervalMileage` against this field to decide a mileage-based service is due, so it is a plain `int` updated on the
  vehicle and never a float or a derived value.
- **The image lives in GridFS and is never served by its storage key.** `imageStorageKey` is server-only and absent from
  `VehicleDto` — the mapper names every field explicitly, so the key cannot leak by being forgotten. The browser fetches
  through `/api/uploads/[id]/view`, which checks ownership before it streams a byte. **A file addressable by its storage key
  is a file with no lock on the door.**
- **The storage seam lands here, guarded and re-encoding.** `storage.guard` warns at 85% and blocks at 95% of
  `STORAGE_CAP_BYTES` and fails open on its own error; uploads are magic-byte verified (PNG/JPEG/WebP only — no SVG by
  design) and re-encoded to WebP through `sharp` with `limitInputPixels` set against a decompression bomb. The 5MB ceiling
  is enforced by `content-length.guard` before the body is read.
- **The vehicle is the aggregate root, so its id is stable and its delete is guarded.** `remove` refuses with
  `CANNOT_DELETE_REFERENCED` while a `MaintenanceSchedule`, `MaintenanceRecord`, `ServiceRequest` or `Invoice` still points
  at the car, and offers the owner a hard-delete that cascades owned content — its schedules, records and the stored image
  bytes — only when nothing depends on it. History is not orphaned by a mis-click.

**Acceptance criteria.** The step is done when:

- `npm run verify:vehicles` passes against a live MongoDB — creating a second vehicle with an existing `vin` (and,
  separately, an existing `registrationNo`) is refused; an owner's `list` returns only their own cars and never another
  owner's; and `remove` refuses while a schedule or booking references the vehicle and cascades the stored image bytes when
  none does, with every fixture cleaned up afterward.
- The verify harness asserts `'imageStorageKey' in vehicleFromEntity(doc)` is `false`, and `VehicleDto` names no
  `_id`/`__v`/storage key.
- An upload larger than 5MB, or whose leading bytes are not a PNG/JPEG/WebP signature, is refused (`with-payload-too-large`
  / a validation code), and `GET /api/uploads/[id]/view` returns 404 for a signed-in caller who does not own the vehicle.
- `npm run lint`, `npx tsc --noEmit` and `npm run build` are green, with `/owner/vehicles`, `/owner/vehicles/new` and
  `/owner/vehicles/[vehicleId]` added as dynamic, `noindex` routes.
- `npm run format` is clean, cspell is green over the new vehicle vocabulary, and every new file is wired into its barrel
  `index.ts`.

---

<a id="step-8"></a>

### Step 8 - Maintenance scheduler & reminders ✅ Done

**Goal.** Automated maintenance tracking with a reminder cron — the promise the product is built on. An owner sets a
time- and/or mileage-based schedule per vehicle; a separate worker sweeps for what has fallen due and enqueues a
notification, exactly once per window.

**Why this matters.** The proposal opens on a single pain: owners track maintenance manually, miss service dates, and pay
for it in breakdowns and cost. Every other feature — booking, records, invoices — is downstream of an owner knowing a
service is due. If the reminder is late, wrong, or duplicated into noise, the product has failed at the one thing it
exists to do. So the due computation is a pure function with a test that runs, and the reminder is a process that runs
whether or not anyone opens the app.

**Deliverables.**

```
lib/services/maintenance.service.ts        schedules create/update/remove · records create/list · computeDue (UPCOMING → DUE → OVERDUE)
lib/utils/schedule-due.utils.ts            pure date/mileage due math — no clock, no db; today and mileage are arguments
lib/utils/schedule-due.utils.test.ts       vitest — the date boundary, the mileage boundary, the shared-endpoint case
lib/services/notification.service.ts       enqueue — the reminder's sink (the multi-channel feed UI expands in step 15)
scripts/send-reminders.ts                  the reminder worker — node-cron entrypoint; the second PM2 app
lib/schemas/schedule-create.schema.ts · schedule-update.schema.ts · record-create.schema.ts
types/maintenance-schedule.dto.ts · maintenance-record.dto.ts     mappers wired into the owner read path
app/(dashboard)/owner/schedules/page.tsx · page-search-params.ts · loading.tsx · new/page.tsx
components/scheduling/                     schedules-screen · schedules-table · schedules-table-row · schedules-filters · schedules-empty
                                           schedule-create.form · schedule-edit.dialog · schedule-status.badge
                                           maintenance-records (read-only history, surfaced on the vehicle detail + schedules screens)
                                           scheduling.types.ts · actions.ts · index.ts
ecosystem.config.js                        gains the second app — send:reminders via cron_restart
package.json                               gains the send:reminders script
constants/codes-scheduling.const.ts        feature digit 3
scripts/verify-scheduling.ts               verify:scheduling
```

**Notes.**

- **The due computation is pure and unit-tested, because a missed reminder is the exact failure the product exists to
  prevent.** `schedule-due.utils.ts` takes a schedule, today's date and the vehicle's `currentMileage` as arguments and
  returns the next status — it reads no clock and touches no database, so every boundary is provable by a test that runs.
  `computeDue` in the service is the thin wrapper that persists what the pure function decides.
- **A schedule is time-based, mileage-based, or both.** `intervalMonths` advances `nextDueDate`; `intervalMileage` sets a
  `nextDueMileage` compared against the vehicle's live `currentMileage`; whichever threshold is crossed first flips the
  status `UPCOMING → DUE`, and a schedule past its due date or mileage advances again to `OVERDUE`. A completed service
  rolls it back to `UPCOMING` (see [step 10](#step-10)).
- **Reminders run in a separate PM2 process on a cron, never inside a request.** `scripts/send-reminders.ts` is the second
  PM2 app (`cron_restart`), sweeping schedules whose `{ status, nextDueDate }` index says they are `DUE`/`OVERDUE` and
  enqueuing a notification to each vehicle owner. **A reminder that waits for someone to open a page is not a reminder.**
- **`lastNotifiedAt` makes the sweep idempotent.** A schedule that is due and was already notified within its window is
  skipped; the field is stamped when the notification is enqueued, so a cron that fires every few minutes still sends one
  reminder per window rather than one per tick. **A reminder you send twice is a reminder they stop reading.**
- **The worker fails soft and logs a count.** One owner's notification failing does not abort the run — the sweep logs how
  many schedules it advanced and how many reminders it enqueued, and moves on. A cron that dies on the first bad row
  reminds no one who came after it. No owner email or PII reaches a log line; the schedule id does.
- **Money and mileage stay integers.** A record's `cost` is integer minor units and `mileageAtService` is an `int`; the
  schedule math is date arithmetic and integer comparison end to end.

**Acceptance criteria.** The step is done when:

- `npm run verify:scheduling` passes against a live MongoDB — a schedule whose `nextDueDate` has passed flips `UPCOMING →
DUE` and one past its grace flips `→ OVERDUE`; a schedule whose vehicle `currentMileage` passes `nextDueMileage` flips on
  mileage alone; a sweep enqueues exactly one notification per due schedule and stamps `lastNotifiedAt`; and a second sweep
  in the same window enqueues none. Fixtures self-clean.
- `npm run test` covers the pure due logic — `schedule-due.utils.test.ts` asserts a schedule due today reads `DUE` (not yet
  `OVERDUE`), the mileage threshold is inclusive at the boundary, and a schedule short of both thresholds stays `UPCOMING`.
- `npm run send:reminders` runs the worker once and exits clean, and under PM2 the reminder app shows as periodically
  running via `cron_restart` while the web app on port `3104` runs continuously.
- `npm run lint`, `npx tsc --noEmit` and `npm run build` are green, with `/owner/schedules` and `/owner/schedules/new`
  added as dynamic, `noindex` routes; `ecosystem.config.js` carries two apps and `package.json` carries `send:reminders`.
- `npm run format` is clean and every new file is wired into its barrel.

---

<a id="step-9"></a>

### Step 9 - Service booking ✅ Done

**Goal.** Online service requests against verified service centers, with a status lifecycle that only ever moves along a
legal edge. An owner books a service at a center an admin has vetted; the center accepts, schedules, works and completes
it; nobody writes a status field by hand.

**Why this matters.** "Simplify service requests / online booking" is a headline objective, and a booking is not a form
submission — it is a scheduled visit and a cost estimate that two parties coordinate over days. The states it moves
through carry real consequences: an accepted booking has a date and a price the center committed to; a cancelled one
frees that slot. A state machine that anyone can shove into any state is where those consequences quietly break, so the
transitions are guarded by a pure function and the owner-vs-center boundaries are checked in the service, not the screen.

**Deliverables.**

```
lib/services/service-request.service.ts    create · accept/decline/start/complete/cancel (one action-based path) · findForOwner · findForCenter
lib/utils/booking-transition.utils.ts      canTransition(from, action) → nextStatus | null — the pure legal-transition guard
lib/utils/booking-transition.utils.test.ts vitest — every legal edge, a sample of illegal ones, terminality
lib/schemas/booking-create.schema.ts · booking-transition.schema.ts
types/service-request.dto.ts               ServiceRequestDto + serviceRequestFromEntity mapper
app/(dashboard)/owner/bookings/page.tsx · page-search-params.ts · loading.tsx · new/page.tsx
app/(dashboard)/center/requests/page.tsx · page-search-params.ts · loading.tsx
components/bookings/                        bookings-screen · bookings-table · bookings-table-row · bookings-filters · bookings-empty
                                           booking-create.form · booking-transition.dialog · booking-priority.badge · booking-status.badge
                                           bookings.types.ts · actions.ts · index.ts
constants/codes-bookings.const.ts          feature digit 4
scripts/verify-bookings.ts                 verify:bookings
```

**Notes.**

- **A booking targets a verified center, checked against the service, not the form.** `create` refuses with
  `CENTER_NOT_VERIFIED` when the target `ServiceCenterProfile.isVerified` is false — an owner cannot book a center an admin
  has not vetted, even if a hand-edited request names one. **A booking against an unverified center is a promise no one
  signed.**
- **Status moves only through the action-based path with its guard, never a raw write.** The five actions each map to one
  legal edge — `PENDING → ACCEPTED` or `→ DECLINED`, `ACCEPTED → IN_PROGRESS`, `IN_PROGRESS → COMPLETED`, and `→ CANCELLED`
  from the early states — and `booking-transition.utils.ts` is the pure arbiter the service consults before it writes,
  refusing `ILLEGAL_TRANSITION` for anything off the graph. **An unguarded state machine is a bug generator.**
- **Each edge carries its own required data.** `ACCEPTED` demands a `scheduledDate` and an `estimatedCost`; `COMPLETED`
  demands a `finalCost`; `DECLINED`, `COMPLETED` and `CANCELLED` are terminal and reject any further move. The guard owns
  the shape of the transition, not merely its legality, so a booking cannot reach `ACCEPTED` without the fields that make
  acceptance mean something.
- **Owner and center touch only what is theirs.** An owner may `cancel` only while a booking is `PENDING` or `ACCEPTED` — a
  center already working cannot be cancelled out from under it — and a center accepts, declines, starts or completes only
  requests assigned to its own profile, refused with `NOT_ASSIGNED_CENTER` otherwise. `findForOwner` and `findForCenter`
  scope every list by the requester.
- **The pure guard is unit-tested so the lifecycle is provable without a database.** `booking-transition.utils.test.ts`
  walks every legal edge and a representative set of illegal ones; the same action-based, guarded shape is reused for order
  fulfillment in [step 12](#step-12), so proving it once pays twice.
- **Priority is an enum with a sane default.** `LOW | NORMAL | HIGH | URGENT`, default `NORMAL`; costs are integer minor
  units from the first estimate.

**Acceptance criteria.** The step is done when:

- `npm run verify:bookings` passes against a live MongoDB — a booking against an unverified center is refused; a legal
  `PENDING → ACCEPTED → IN_PROGRESS → COMPLETED` walk succeeds with its required fields at each edge; an owner `cancel`
  after `IN_PROGRESS` is refused; a `DECLINED` booking rejects every further transition; and a center attempting to
  transition another center's request is refused. Fixtures self-clean.
- `npm run test` covers the pure transition guard — `booking-transition.utils.test.ts` asserts each legal edge returns its
  next status and an illegal one (for example `COMPLETED → IN_PROGRESS`) returns `null`.
- `npm run lint`, `npx tsc --noEmit` and `npm run build` are green, with `/owner/bookings`, `/owner/bookings/new` and
  `/center/requests` added as dynamic, `noindex` routes.
- `npm run format` is clean, cspell is green, and every new file is wired into its barrel.

---

<a id="step-10"></a>

### Step 10 - Service-center operations ✅ Done

**Goal.** The service-center side of a booking, carried through to a durable maintenance record and a SERVICE invoice. A
center manages its own profile, works the requests assigned to it, records what was actually done, and bills for it — and
completing a service closes the reminder loop [step 8](#step-8) opened.

**Deliverables.**

```
lib/services/service-center.service.ts     own-profile management · assigned-request queries (reuses findForCenter from step 9)
lib/services/maintenance.service.ts        + records.create on completion — extends the records methods from step 8
lib/services/invoice.service.ts            issueServiceInvoice — a SERVICE invoice for a completed booking (payments land in step 13)
lib/schemas/record-on-completion.schema.ts · service-center-profile.schema.ts
types/service-center.dto.ts · invoice.dto.ts    ServiceCenterDto + the issue-side InvoiceDto mapper
app/(dashboard)/center/page.tsx                  the center home — assigned-request summary
app/(dashboard)/center/records/page.tsx · page-search-params.ts · loading.tsx
app/(dashboard)/center/invoices/page.tsx · loading.tsx
app/(dashboard)/center/profile/page.tsx
components/center/                          center-dashboard · records-screen · record-create.form · record-detail
                                           service-invoices-screen · service-invoice.dialog · center-profile.form
                                           center.types.ts · actions.ts · index.ts
constants/codes-billing.const.ts           feature digit 7 (issue side; extended in step 13)
```

**Notes.**

- **The maintenance record is the durable history, kept even after the booking is archived.** A `ServiceRequest` is a
  transaction that ends; a `MaintenanceRecord` — service type, `mileageAtService`, `cost` in minor units, `performedOn`,
  notes — is the vehicle's permanent service log, tied to the completed request but outliving it in the owner's records
  view. **A booking is a promise; a record is what actually happened.**
- **A record is written on completion, tied to the completed booking.** `maintenance.service.ts`'s `records.create` is
  reached from the center's `complete` transition ([step 9](#step-9)): it captures what was done and the mileage at
  service, and advances the vehicle's `currentMileage` when the recorded mileage is higher — the scheduler's input stays
  current without the owner re-typing it.
- **Completion optionally rolls the related schedule to its next interval.** When the completed booking's `serviceType`
  matches an open `MaintenanceSchedule` for the vehicle, the record advances it — `nextDueDate` forward by
  `intervalMonths`, `nextDueMileage` to `mileageAtService + intervalMileage` — and flips it back to `UPCOMING`. The
  reminder that fired is the reminder that gets retired.
- **A center issues a SERVICE invoice for its own work, and only its own.** `issueServiceInvoice` creates an
  `Invoice { type: SERVICE, reference: <the ServiceRequest>, issuedBy: <the center's user> }` in `UNPAID` with
  integer minor-unit `subtotal`/`tax`/`total`; recording a payment and flipping it to `PAID` is [step 13](#step-13). This
  step issues the bill; the next one settles it.
- **A center manages only its own profile and requests.** `service-center.service.ts` scopes every read and write to the
  requesting center's `ServiceCenterProfile`; a center touching another center's request or records is refused
  `NOT_ASSIGNED_CENTER`, the same scoping the transition path enforced in [step 9](#step-9). Admin verification of the
  profile ([step 6](#step-6)) is the gate that made the center bookable in the first place.

**Acceptance criteria.** The step is done when:

- An accepted-then-completed booking produces exactly one `MaintenanceRecord` tied to the request, with the mileage at
  service recorded and the vehicle's `currentMileage` advanced when higher; when a matching schedule was open, it rolls to
  its next interval and flips to `UPCOMING` — exercised by `npm run verify:bookings` (the completion path writes the
  record) and `npm run verify:scheduling` (the schedule rolls forward).
- Issuing a SERVICE invoice for a completed booking creates an `Invoice { type: SERVICE }` in `UNPAID` with integer
  minor-unit totals, and a center cannot issue against — or view the records or invoices of — another center's requests;
  the SERVICE-invoice issue path is covered by `npm run verify:invoices` (extended with payments in [step 13](#step-13)).
- `npm run lint`, `npx tsc --noEmit` and `npm run build` are green, with `/center`, `/center/records`, `/center/invoices`
  and `/center/profile` added as dynamic, `noindex` routes.
- `npm run format` is clean, cspell is green, and every new file is wired into its barrel.

---

<a id="step-11"></a>

### Step 11 — Marketplace: suppliers & products ✅ Done

**Goal.** The utility-supply catalog that verified suppliers manage and vehicle owners browse — the seller-side of the
platform that turns "I need an oil filter" into a listing an owner can find, filter, and order. It sits after service
booking because it is the second transactable surface: a supplier, like a service center, self-registers but only
becomes real to buyers once an admin has verified it, and this step is where that verification finally pays off in a
product an owner can see.

**Deliverables.**

```
lib/services/supplier.service.ts       profile read/update · admin verify (flips isVerified) · public directory of verified sellers
lib/services/product.service.ts        list · create · update · setActive — supplier-scoped writes · public browse (category/search/price)
lib/schemas/product-create.schema.ts   zod — name · category · sku · description · price(minor) · stockQuantity — NO supplier field
lib/schemas/product-update.schema.ts   partial of create, minus sku (a sku is not re-keyed)
lib/schemas/product-browse.schema.ts   query zod — category? · q? · minPrice? · maxPrice? · page — the filter contract
lib/schemas/supplier-profile.schema.ts businessName · address · city · phone
types/product.dto.ts                   ProductDto + productFromEntity  (no imageStorageKey, no _id, no __v)
types/supplier.dto.ts                  SupplierDto + supplierFromEntity
constants/product.const.ts             PRODUCT_CATEGORIES = OIL|FILTER|TIRE|BATTERY|BRAKE|WIPER|COOLANT|ACCESSORY|OTHER
constants/codes.const.ts               (extended) feature 5 = Marketplace error codes
app/(dashboard)/supplier/products/page.tsx              the seller's own catalog, active + inactive
app/(dashboard)/supplier/products/new/page.tsx          create a listing
app/(dashboard)/supplier/profile/page.tsx               manage the SupplierProfile + verification banner
app/(dashboard)/owner/marketplace/page.tsx              public/authenticated browse with URL-driven filters
app/(dashboard)/owner/marketplace/[productId]/page.tsx  product detail + the order entry point (step 12)
components/marketplace/     product-card · product-grid · product-filters · category-filter · price-range.field
                           product.form · product-detail · product-status.badge · supplier-badge · marketplace.types.ts · actions.ts · index.ts
components/supplier/        supplier-profile.form · verification-banner · index.ts
scripts/verify-marketplace.ts          seeds a verified and an unverified supplier; asserts sku uniqueness, browse visibility, filters
```

**Notes.**

- **The seller is the session, never the form.** `supplierId` is derived from the authenticated supplier's
  `SupplierProfile`; `product-create.schema.ts` has no supplier field at all, so there is nothing to spoof. A form that
  could name its own seller is a form that could list a rival's stock under your name. **The catalog trusts the session
  for who sells, and the form for nothing else.**
- **An unverified supplier has a catalog no one can browse.** Publishing an active product requires `isVerified`, and
  public browse joins `Product` to `SupplierProfile` and drops any listing whose seller is unverified — a self-registered
  supplier can draft products, but they stay invisible until an admin flips the gate in [step 6](#step-6). Transactable
  is a state you are granted, not one you assert.
- **`sku` is unique platform-wide, and guarded twice.** The unique index is the truth; a service-layer pre-check turns a
  duplicate into a typed `Result` refusal with a feature-5 code instead of letting a driver `E11000` surface as a 500.
  **A unique index is the law; the pre-check is the manners.**
- **Category is a closed enum, price is minor units, and both drive the filters.** `PRODUCT_CATEGORIES` is a fixed set,
  `price` is an integer in minor units, and browse filters on category, free-text `q`, and a min/max price range carried
  in the URL via `nuqs` — a filtered view is a link you can paste, not client state that evaporates on reload.
- **Stock is just the integer [step 12](#step-12) decrements.** `stockQuantity` is a plain count here; the catalog's job
  is to set it honestly, and all the atomic contention over the last unit lives in the order transaction, not in the
  listing screen.

**Acceptance criteria.**

The step is done when:

- `npm run verify:marketplace` passes end to end against a live MongoDB, self-cleaning after itself.
- A second product created with an existing `sku` is refused with a marketplace error code — never a raw driver
  exception — and no row is written.
- An unverified supplier's products do not appear in `/owner/marketplace` browse or product detail, while a verified
  supplier's active products do.
- Category, free-text, and min/max price filters each narrow the result set to exactly the matching listings, and the
  filter state round-trips through the URL.
- Creating or updating a product ignores any `supplier` sent in the payload and always binds to the caller's
  `SupplierProfile`.
- `npm run lint`, `npm run test`, and `npm run build` are green with the four new marketplace pages routing.

---

<a id="step-12"></a>

### Step 12 — Orders & fulfillment ✅ Done

**Goal.** Owners order utility supplies from a single supplier, and suppliers move those orders from placed to delivered.
It follows the marketplace because it is the marketplace's write path: [step 11](#step-11) made a product findable, and
this step makes it buyable — reserving stock the instant an order is placed, snapshotting each line's price, and walking
the order through a fulfillment lifecycle no raw status write can shortcut.

**Deliverables.**

```
lib/services/order.service.ts          create (items · atomic stock decrement · price snapshot · totals) · advance · cancel (restock)
lib/services/order.service.test.ts     order-transition: every legal move passes, every illegal jump is refused
lib/schemas/order-create.schema.ts     zod — supplier · items[{ product, quantity }] · shippingAddress — prices are NOT trusted from here
lib/schemas/order-status.schema.ts     the transition action enum (confirm|pack|ship|deliver|cancel)
types/order.dto.ts                     OrderDto + OrderItemDto + orderFromEntity  (line prices exposed, storage keys never)
constants/order.const.ts               ORDER_STATUS = PENDING|CONFIRMED|PACKED|SHIPPED|DELIVERED|CANCELLED + the legal-transition map
constants/codes.const.ts               (extended) feature 6 = Orders error codes
app/(dashboard)/owner/orders/page.tsx              the buyer's orders
app/(dashboard)/owner/orders/[orderId]/page.tsx    order detail · line items · cancel-before-ship
app/(dashboard)/supplier/orders/page.tsx           the seller's fulfillment queue
app/(dashboard)/supplier/orders/[orderId]/page.tsx order detail · the advance-status control
components/marketplace/    cart · order-summary · order-line · checkout.dialog · order-status.badge · order-timeline  (buyer side)
components/supplier/       fulfillment-panel · order-status.control · index.ts  (seller side)
scripts/verify-orders.ts               places, over-orders, cancels, and walks a full lifecycle; asserts stock math and guards
```

**Notes.**

- **One order targets exactly one supplier.** A cart that spans two sellers is two orders, because stock, fulfillment,
  and the eventual `ORDER` invoice all belong to a single supplier — a mixed order would have no one owner of its
  shipment or its bill.
- **Stock is decremented atomically, inside the create transaction.** Each line issues a conditional `$inc` that both
  checks the floor and decrements in the single write the database serializes; if any line lacks stock the whole order is
  refused, naming the offending product, and nothing is decremented. Two owners racing for the last tire cannot both win.
  **Oversold is a promise you cannot keep.**
- **Every line snapshots `unitPrice` at order time.** `OrderItem` stores the price as it stood when the order was placed,
  and `subtotal`/`shippingFee`/`tax`/`totalAmount` are integer minor units summed from those snapshots; a later catalog
  price change never rewrites a placed order. **A price is a fact at the moment of sale, not a live lookup.**
- **Status moves only through the guarded transition.** `PENDING → CONFIRMED → PACKED → SHIPPED → DELIVERED`, plus
  `CANCELLED`, each go through `advanceOrderStatus`/`cancelOrder` against the legal-transition map — a jump from `PENDING`
  straight to `SHIPPED` matches no legal edge and is refused. The status field is never written raw.
- **Cancellation before `SHIPPED` restocks exactly what it reserved.** The mirror `$inc` puts the units back; once the
  goods are shipped they are gone, and cancel is refused rather than faking a restock. **A refused action is data, not an
  exception.**

**Acceptance criteria.**

The step is done when:

- `npm run verify:orders` passes end to end against a live MongoDB, cleaning up after itself.
- An order whose quantity exceeds stock is refused with the offending product identified, and the transaction leaves
  every `stockQuantity` untouched.
- A cancel issued before `SHIPPED` restores precisely the units the order reserved; a cancel attempted after `SHIPPED` is
  refused.
- An illegal status jump is rejected by the transition guard, verified by the `order-transition` unit test under
  `npm run test`.
- Order totals reconcile to the minor unit — `subtotal + shippingFee + tax == totalAmount` — with no float on the path.
- `npm run lint`, `npm run test`, and `npm run build` are green with the owner and supplier order pages routing.

---

<a id="step-13"></a>

### Step 13 — Invoices & payments ✅ Done

**Goal.** Billing for both sides of the platform — a `SERVICE` invoice for a completed booking and an `ORDER` invoice for
a fulfilled order — and the payments that settle them. It comes after both transactable flows are built because it is
where they converge: a service center and a supplier issue different invoices from different sources, but they land on
one ledger, in one money type, settled by one payment path.

**Why this matters.** This is the single surface where a wrong value is literally money. A booking and an order reach it
from two unrelated domains, and the moment they touch a total, a float or a rounding drift stops being a code smell and
becomes a silent, compounding liability on someone's balance. It is also where card data would live if we were careless
enough to store it — so the correctness bar and the privacy bar are both at their highest here, on purpose. Getting
invoices exact and payments auditable is what lets an owner trust a total and lets a center or supplier actually get
paid.

**Deliverables.**

```
lib/services/invoice.service.ts        issue SERVICE (completed booking) · issue ORDER (an order) · list · get — role-scoped
lib/services/payment.service.ts        recordPayment · mark PAID when covered · flip Order.paymentStatus on an ORDER invoice
lib/utils/money.ts                     minor-unit sum · format · reconcile — the only place currency arithmetic happens
lib/utils/money.test.ts                integer-only sum/format; asserts no float ever enters a total
lib/schemas/invoice-issue.schema.ts    type(SERVICE|ORDER) · reference · lines · tax · dueDate
lib/schemas/payment-record.schema.ts   invoice · amount(minor) · method(CARD|CASH|BANK_TRANSFER|WALLET) · transactionRef?
types/invoice.dto.ts                   InvoiceDto + invoiceFromEntity
types/payment.dto.ts                   PaymentDto + paymentFromEntity  (never a PAN, never a storage key)
constants/invoice.const.ts             INVOICE_TYPE · INVOICE_STATUS = UNPAID|PAID|OVERDUE|CANCELLED
constants/payment.const.ts             PAYMENT_METHOD · PAYMENT_STATUS = PENDING|SUCCEEDED|FAILED|REFUNDED
constants/codes.const.ts               (extended) feature 7 = Billing error codes
app/(dashboard)/owner/invoices/page.tsx              the payer's invoices + pay control
app/(dashboard)/center/invoices/page.tsx             issue a SERVICE invoice for a completed request
app/(dashboard)/supplier/invoices/page.tsx           issue an ORDER invoice for an order
app/(dashboard)/*/invoices/[invoiceId]/page.tsx      invoice detail + the access-checked PDF
components/shared/    invoice-table · invoice-detail · invoice-status.badge · payment.dialog · payment-method.field · money · index.ts
scripts/verify-invoices.ts             issues both invoice types, records covering + partial payments, asserts the two-row flip
```

**Notes.**

- **Every monetary field is an integer minor unit, computed without a single float.** Subtotals, tax, and totals are
  summed and stored as integers, and `money.ts` is the only module that touches currency arithmetic; the UI formats at
  the very edge and never before. **Floating-point money is a bug with a delay on it.**
- **An invoice names its source; it does not become it.** `type` is `SERVICE` or `ORDER` and `reference` is the
  `ObjectId` of the completed `ServiceRequest` or the `Order`; the amounts are snapshotted at issue, so re-pricing the
  order later never re-bills a paid invoice.
- **A covering successful payment flips two rows, in one transaction.** When the `SUCCEEDED` payments recorded against an
  invoice cover its `total`, the invoice moves to `PAID`; and for an `ORDER` invoice, `Order.paymentStatus` moves to
  `PAID` in the same transaction — two rows or neither, never a paid invoice against an unpaid order.
- **Payments are recorded in MongoDB — there is no card gateway.** Settlement happens out of band (cash, bank transfer,
  wallet, or a card taken at the counter); the platform records only the `method`, the `amount`, and an optional
  `transactionRef`, then marks the invoice `PAID` when the recorded payments cover its total. No `STRIPE_*`, no
  webhooks, no card numbers. **A card number you keep is a breach you scheduled — so we never take one.**
- **The invoice PDF is rendered server-side and streamed access-checked.** It is generated into the GridFS `uploads`
  bucket and served through the owner-gated download route with `nosniff` — never a guessable public link, because an
  invoice is a private financial record, not a shared asset.

**Acceptance criteria.**

The step is done when:

- `npm run verify:invoices` passes end to end against a live MongoDB, cleaning up after itself.
- Issued totals reconcile to the minor unit — `subtotal + tax == total` — proven by the `money` unit test under
  `npm run test`, with no float on the path.
- A successful payment that covers an invoice's total flips it to `PAID`; a short payment leaves it `UNPAID`.
- Settling an `ORDER` invoice sets the referenced order's `paymentStatus` to `PAID` in the same transaction; a `SERVICE`
  invoice touches only the invoice.
- Only a service center may issue a `SERVICE` invoice for its own completed request, and only a supplier an `ORDER`
  invoice for its own order; the owner is the payer on both.
- `npm run lint`, `npm run test`, and `npm run build` are green with the owner, center, and supplier invoice pages
  routing.

---

<a id="step-14"></a>

### Step 14 - Messaging ✅ Done

**Goal.** A place for an owner and a service center to talk in the context of the work itself — a booking they both
see — so a question about a service request does not leave the platform for a phone call nobody logged. This step
delivers the two-party conversation, the message thread with an optional attachment, and the two inboxes. It sits
after service-center operations ([step 10](#step-10)) because a conversation needs a booking to be about; before that,
there is nothing to say.

**Deliverables.**

```
lib/services/message.service.ts            MessageService — startOrFind · listMessages · send(+attachment) · markRead
lib/schemas/conversation-start.schema.ts   owner + center (+ optional booking) — zod-validated
lib/schemas/message-send.schema.ts         body + optional attachment metadata
types/conversation.dto.ts                  ConversationDto + conversationFromEntity
types/message.dto.ts                       MessageDto + messageFromEntity — attachmentStorageKey never leaks
app/api/messages/[conversationId]/route.ts POST send — same-origin gated, multipart attachment
app/(dashboard)/owner/messages/page.tsx    owner inbox + thread, ordered by lastMessageAt
app/(dashboard)/owner/messages/actions.ts  startConversationAction · markReadAction
app/(dashboard)/center/messages/page.tsx   center inbox + thread
components/messages/                        conversation-list · message-thread · message-composer · message-attachment · index.ts
lib/storage/                               (reuse) magic-byte verify + GridFS "uploads" for attachments
```

**Notes.**

- **A conversation is exactly one owner and one service center, optionally scoped to one booking, and its
  participants are fixed at creation.** `startOrFind` never widens the guest list; it returns the existing thread
  for a given owner+center(+`serviceRequest`) rather than spawning a second. **A thread with an open guest list is
  an inbox anyone can read.**
- **Only the two participants may read or post, enforced in `MessageService`, not in the page.** Every read and
  send re-checks the caller against the conversation's `owner` and `serviceCenter`; a third owner, a supplier, or an
  admin who is not a participant gets `withForbidden`. The UI merely hides what the service already refuses.
- **Messaging is owner ↔ service center on purpose — suppliers coordinate through orders, not chat.** A supplier's
  state lives in an `Order`'s status transitions and its invoice, which are auditable; a free-text side channel would
  compete with that record. The one relationship that genuinely needs conversation is the service booking.
- **`lastMessageAt` orders the inbox.** One indexed field, stamped on every `send`, floats the freshest thread to the
  top without sorting message bodies — the inbox is a cheap query, not a scan.
- **An attachment travels the same upload-safety path as an image.** The send route runs magic-byte verification and
  the storage cap guard before a byte reaches the GridFS `uploads` bucket; the resulting `attachmentStorageKey` is
  server-only and never appears in `MessageDto`. **A file that lies about its type is the oldest attack in the book.**
- **Sending is an API route, not a Server Action, because it carries a streamed multipart body.** The route is
  same-origin gated by the proxy; starting a conversation and marking it read stay Server Actions.

**Acceptance criteria.**

The step is done when:

- An owner opens a booking and starts a conversation scoped to it; the same owner+center+booking never yields a
  second conversation — `startOrFind` returns the existing one.
- Both participants can post and read the thread; a non-participant account is refused with `withForbidden` — proven
  by the participant guard and its co-located unit test in `npm run test`.
- An attachment whose bytes contradict its declared content type is rejected before it reaches GridFS — proven by the
  `file-signature` test in `npm run test`.
- `lastMessageAt` advances on every send and the inbox renders newest-first.
- `npm run lint`, `npm run test` and `npm run build` are green, and the send route answers only same-origin callers.

---

<a id="step-15"></a>

### Step 15 - Notifications ✅ Done

**Goal.** A single, recipient-scoped feed fed by the domain events that already exist — a maintenance schedule that
fell `DUE`, a booking that changed status, an order or payment that moved, a new message — surfaced in-app and echoed
over email (nodemailer). This step delivers the notification service, the two channel drivers, the wiring from each
producer, and the topbar bell. There is no SMS or push channel — email is the only outbound one.

**Why this matters.** The proposal's headline objective is to automate maintenance tracking with _timely reminders_ —
an owner who misses an oil change, a filter, or a battery swap is the exact failure this platform exists to prevent.
Notifications are where a schedule that computed itself `DUE` in [step 8](#step-8) becomes a message a human actually
sees; the maintenance reminder is the flagship producer, and every other event rides the same feed. Without this step,
the scheduler computes due-ness into a void.

**Deliverables.**

```
lib/services/notification.service.ts    NotificationService — create · listForUser · markRead · unreadCount
lib/notifications/channel.types.ts      NotificationChannel shape — deliver(notification)
lib/notifications/in-app.channel.ts     writes the Notification row — the source of truth, always on
lib/notifications/email.channel.ts      best-effort via lib/mail (nodemailer / log-fallback)
lib/notifications/dispatch.ts           fan-out: in-app first, then email best-effort
lib/notifications/index.ts              barrel
types/notification.dto.ts               NotificationDto + notificationFromEntity
components/dashboard/notification-bell.tsx   topbar affordance — unread count + feed dropdown
app/(dashboard)/actions.ts              markNotificationReadAction (dashboard-wide)
scripts/send-reminders.ts               (from step 8) reminder worker — enqueues DUE notifications, stamps lastNotifiedAt
lib/services/service-request.service.ts (wired) accept/decline/start/complete/cancel -> notify owner or center
lib/services/order.service.ts           (wired) status + paymentStatus change -> notify the buyer
lib/services/message.service.ts         (wired) send -> notify the other participant
```

**Notes.**

- **The in-app channel is the source of truth; email is a best-effort echo of the same event.** `dispatch` writes the
  `Notification` row first, then attempts email; a failed send is logged, never thrown. **The record is the
  notification; the email is only its echo.**
- **Email degrades to the log transport when SMTP is absent.** With `SMTP_HOST` unset, `lib/mail` writes each message
  to the logger instead of sending — the `deliver` call still succeeds, so the whole flow runs on a laptop with no
  mail account. There is no SMS or push channel to configure. **A missing mail server is a logged message, not a
  failed booking.**
- **Every notification is scoped to its recipient `user`.** `listForUser` and `unreadCount` filter by the session
  user, so no feed ever carries another account's events; a notification's `data` payload never embeds a bearer
  secret or a storage key.
- **The reminder worker is idempotent, and `lastNotifiedAt` is the marker.** The sweep notifies a schedule only when
  it is `DUE`/`OVERDUE` and outside its notify window, then stamps `lastNotifiedAt` — so a second run of
  `npm run send:reminders`, or a crash mid-batch and a re-run, re-notifies nobody. **A reminder that forgets what it
  sent is a spam cannon on a timer.**
- **The unread count is a cheap query refreshed on navigation, carried into the topbar bell — not a socket.** The
  count is read server-side in the dashboard layout and rendered on the bell; a real-time transport is left as a
  backlog seam rather than pretended.

**Acceptance criteria.**

The step is done when:

- A `DUE` maintenance schedule, a booking status change, an order or payment update, and a new message each write
  exactly one recipient-scoped `Notification` — asserted by `verify:scheduling`, `verify:bookings` and
  `verify:orders`, all run in sequence by `npm run smoke`.
- `unreadCount` returns the correct number for the session user and `markNotificationReadAction` zeroes the read
  rows.
- `IN_APP` always writes, and `EMAIL` sends when `SMTP_*` is present and falls back to the log transport when it is
  absent; the graceful-degradation path is covered by `npm run test`.
- A second reminder sweep of the same `DUE` schedule notifies no one twice — `lastNotifiedAt` is the truth, proven by
  `npm run verify:scheduling`.
- `npm run lint`, `npm run test` and `npm run build` are green with the topbar bell rendering its count.

---

<a id="step-16"></a>

### Step 16 - Reviews & ratings ✅ Done

**Goal.** Owner-authored reviews of the parties an owner actually transacts with — a service center, a supplier, or a
product — with the target's running rating recomputed in the same breath as the review is written. This step delivers
the review service, its schema and DTO, the create action, and the rating widgets that hang on the center, supplier
and product surfaces. It sits after the marketplace and orders because a review presupposes a completed transaction to
review.

**Deliverables.**

```
lib/services/review.service.ts       ReviewService — create · listByTarget · recomputeAggregate (transactional)
lib/schemas/review-create.schema.ts  targetType (SERVICE_CENTER|SUPPLIER|PRODUCT) · targetId · rating(1-5) · optional comment
types/review.dto.ts                  ReviewDto + reviewFromEntity
app/(dashboard)/owner/actions.ts     createReviewAction — owner-only, thin over the service
components/shared/                    rating-stars · review-list · review-form.dialog · index.ts
components/marketplace/              (wired) product review block on the product view
components/center/ · components/supplier/  (wired) rating badge + review list on the center/supplier views
```

**Notes.**

- **Only an owner authors a review, because the owner is the customer in every relationship.** An owner books
  centers, orders supplies, and buys products; centers and suppliers are the reviewed, never the reviewers.
  `ReviewService.create` gates on `requireRole('owner')`. **The customer writes the review; nobody reviews
  themselves.**
- **One review per author per target, enforced by a unique compound index `{author, targetType, targetId}`.** A
  resubmission updates the existing row in place rather than stacking a duplicate; a `rating` is an integer `1..5`,
  validated by zod before it reaches the service.
- **The aggregate is recomputed transactionally with the write.** `recomputeAggregate` re-derives `ratingAvg` and
  `ratingCount` on the `ServiceCenterProfile`, `SupplierProfile` or `Product` inside the same Mongo session as the
  `Review` upsert. **An average kept apart from its rows is a lie waiting to happen.**
- **Recompute is a re-aggregation of the surviving rows, not an incremental `+=`/`-=`.** An edited or removed review
  cannot corrupt a running total, because there is no running total — only the current rows and their mean.
- **A review is gated on a real transaction with the target** — a completed `ServiceRequest`, a delivered `Order`, or
  a purchased `Product` — checked in the service, not the UI, so the ratings reflect actual customers.

**Acceptance criteria.**

The step is done when:

- An owner can review a service center, a supplier, and a product they transacted with; a non-owner is refused.
- A second review by the same author on the same target updates the existing row rather than inserting a duplicate —
  proven by the unique-index behavior.
- After every write, the target's `ratingAvg` and `ratingCount` equal a fresh aggregation of the `Review` rows —
  the transactional recompute invariant is covered by `npm run test`, and `npm run verify:reports` reads the same
  aggregates without drift.
- `npm run lint`, `npm run test` and `npm run build` are green with the rating widgets rendering on the center,
  supplier and product views.

---

<a id="step-17"></a>

### Step 17 - Reports & analytics ✅ Done

**Goal.** The numbers each role runs the place by — an owner's maintenance summary and spend, a service center's
requests, completion rate and revenue, a supplier's orders, units, revenue and top products, and the admin's
platform-wide overview — each scoped to the caller and aggregated in the database. This step delivers the report
service, the `/admin/reports` page, the per-role summary widgets on every dashboard home, and the verifier.

**Why this matters.** "Coordinate the parties with reports" and "increase efficiency" are proposal objectives that
only pay off once there is data to summarize. A report turns the accumulated vehicles, schedules, bookings, orders,
invoices and payments into figures a human acts on — the owner's upcoming service and cost, the center's throughput,
the supplier's best sellers, the admin's health of the platform. It is the last core step because it reads everything
the earlier steps wrote.

**Deliverables.**

```
lib/services/report.service.ts       ReportService — ownerMaintenanceSummary · serviceCenterPerformance · supplierSales · adminPlatformOverview
lib/schemas/report-query.schema.ts   from · to · groupBy — zod-bounded, parsed from nuqs params
types/report.dto.ts                  report row/summary shapes + mappers — counts, never PII
app/(dashboard)/admin/reports/page.tsx   platform overview — admin only
components/admin/                     report tables + hand-authored server-SVG charts + index.ts
components/dashboard/                 stat-tile · summary-card — per-role home rollups (owner/center/supplier/admin)
scripts/verify-reports.ts            npm run verify:reports — live DB, self-cleaning
```

**Notes.**

- **A report is a read model over the same collections, never a second source of truth.** Every figure is a Mongo
  aggregation pipeline computed on read; there is no rollup table to fall out of sync with the rows it summarizes.
  **A cached total is a lie the moment the source changes** — so hot reads may be cached on a short TTL, but the cache
  is derived, never authoritative.
- **Every rollup respects the same access rules as the underlying rows.** `ReportService` takes the requester and
  scopes each pipeline: an owner sees only their own maintenance and spend, a center only its own assigned requests,
  a supplier only its own sales; platform-wide analytics are admin-only and carry counts, never customer PII.
- **Money is summed in integer minor units and formatted once at the edge.** Revenue never passes through a float on
  its way to a total. **Floating-point money is a bug with a delay on it.**
- **Every rate ships with its denominator.** Completion rate is completed of requested; fulfillment is delivered of
  placed. A rate without its base is decoration, so each one renders alongside the count it divides.
- **Charts are hand-authored server-rendered SVG, themed through the design tokens** — no client charting dependency,
  no runtime fetch; wide tables and charts scroll inside an `overflow-x` wrapper so the page body never scrolls
  sideways.

**Acceptance criteria.**

The step is done when:

- `npm run verify:reports` passes against a live MongoDB with self-cleaning fixtures: seeded vehicles, schedules,
  bookings and orders produce the exact maintenance-summary, completion-rate, revenue, units and top-product figures.
- An owner's report counts only their own vehicles, schedules and spend; a center sees only its own performance; a
  supplier only its own sales; the admin spans the platform — the scoping is proven by cross-tenant fixtures that must
  not appear in a caller's rollup.
- Revenue totals are integer minor units aggregated in the pipeline, not summed in a page loop, and every rate is
  labeled by its denominator.
- `npm run lint`, `npm run test` and `npm run build` are green with `/admin/reports` and the per-role summary widgets
  rendering.

---

<a id="step-18"></a>

### Step 18 — Hardening

**Goal.** Close the abuse vectors before anyone can reach them. Every feature is built by this point, so this step
stops adding surface and starts defending it — the security headers, the pre-buffer upload checks, a rate limit on
every write path, and the handful of quiet controls (timing-equalized sign-in, fail-closed sessions, pixel-bomb
caps, escaped JSON-LD, a scrubbing logger) that a demo never exercises but an attacker will. It sits here, after the
features and before testing, because a control is only real once the seam it guards exists.

**Why this matters.** The proposal ships a payment surface, a public marketplace, and self-service registration for
three business roles — every one of those is an invitation. A booking form is also an unauthenticated write path; an
image upload is also a way to exhaust a disk or a decoder; a sign-in box is also a bcrypt oracle you rented to the
world. None of these are bugs in a feature — they are the cost of having the feature at all, and the only place to
pay it is a deliberate pass that names each abuse and puts the specific control in front of it. **A control you can
name the attack for is a control; everything else is a hope.**

**Deliverables.**

```
next.config.ts                            security headers — CSP, frame-ancestors 'none', HSTS (prod), X-Content-Type-Options, Referrer-Policy
lib/api/content-length.guard.ts           Content-Length pre-check — refuse before formData() buffers a byte
lib/api/same-origin.guard.ts              Origin/Referer gate on every /api mutation (paired with the proxy)
lib/api/with-payload-too-large.response.ts · with-too-many-requests.response.ts   the 413 / 429 helpers, Retry-After: 60
constants/rate-limit.const.ts             SIGN_IN · SIGN_IN_CALLER · REGISTER · RESEND · PASSWORD_RESET · UPLOAD · ORDER budgets
lib/services/rate-limit.guard.ts          atomic $inc upsert on the ratelimits collection, TTL-swept, fails open
models/rate-limit.model.ts                the counter doc — key sha256(identity), TTL index on expiresAt
lib/utils/caller.util.ts                  resolveCallerKey — leftmost x-forwarded-for only behind TRUSTED_PROXY
lib/services/auth.service.ts              verifyCredentials — anti-enumeration + timing-equalized dummy bcrypt
lib/auth/session.ts                       getSessionUser — reloads the live row, fails closed for admin/super-admin on a DB error
lib/storage/image.ts                      sharp limitInputPixels + magic-byte verification against pixel-bombs
lib/seo/json-ld.ts                        the schema-dts @graph, HTML-escaped — no </script> break-out
lib/logger.ts                             token / PII scrubbing in the pino serializers
env/server.ts                             TRUSTED_PROXY read here, through env, never raw process.env
scripts/verify-accounts.ts                exercises the rate-limit budgets and the sign-in ceiling end to end
```

**Notes.**

- **The Content-Length pre-check runs before `formData()`, not after.** A multipart body that is read to learn its
  size is a body an attacker already made you buffer; the guard refuses on the declared length and the storage cap
  before the first byte is decoded, so an oversized or storage-exhausting upload never lands in memory. **A limit you
  enforce after you have read the body is a limit you did not enforce.**
- **Sign-in is neither a timing oracle nor a spray target.** `verifyCredentials` runs a dummy bcrypt compare on a
  missing user so a real and a fake email cost the same wall-clock, and the `SIGN_IN` budget bounds failures per
  identifier while `SIGN_IN_CALLER` caps how many identities one machine may try — a bcrypt spray is throttled without
  letting one attacker lock a victim out of a shared NAT.
- **The session reloads the live user every call and fails closed where it counts.** Revocation lands within the hour
  because `getSessionUser` re-reads the row, and on a database error it denies for `admin`/`super-admin` and permits
  for the business roles — the blast radius of a hiccup is a downgraded owner, never an unguarded admin screen.
- **The caller key trusts `x-forwarded-for` only behind `TRUSTED_PROXY`.** Off, every unauthenticated caller is one
  bucket and the header is ignored; on, the leftmost hop is the key and the reverse proxy is contracted to set it.
  A rate limiter that trusts a spoofable header is a limiter an attacker re-addresses to their victim.
- **The two injection sinks are shut at the serializer.** JSON-LD is emitted through an escaper so a crafted product
  name cannot close the `<script>` and inject markup, and `sharp` is pinned with `limitInputPixels` so a small file
  that decodes to a billion pixels is rejected rather than allowed to eat the worker — no SVG is accepted by design.
- **The logger scrubs before it writes.** Tokens, password fields, and PII pass through pino serializers that redact
  them, because the cheapest place to leak a reset token is a log line nobody meant to keep.

**Acceptance criteria.** The step is done when:

- The security-header block is present on every page response (CSP, `frame-ancestors 'none'`, HSTS in production,
  `X-Content-Type-Options: nosniff`, a `Referrer-Policy`), verifiable with `curl -I` against any route.
- An upload whose `Content-Length` exceeds the image ceiling, or whose pixels exceed the `sharp` limit, is refused
  with `413` before it is buffered — proven by the upload path returning `withPayloadTooLarge` without reading the body.
- Sign-in is not a timing or enumeration oracle: a known and an unknown email take the same measured time, and the
  `SIGN_IN` / `SIGN_IN_CALLER` budgets return `429` with `Retry-After: 60` once spent.
- Every write path (`register`, sign-in, resend, password reset, uploads, orders) is rate-limited from
  `constants/rate-limit.const.ts`, and `npm run verify:accounts` reports the budgets opening, closing, and reopening.
- `getSessionUser` denies `admin`/`super-admin` on a simulated DB error, and `npm run lint` and `npm run build`
  (which imports `env/server.ts`, so a missing `TRUSTED_PROXY` or `AUTH_SECRET` fails the build) are both green.

---

<a id="step-19"></a>

### Step 19 — Polish

**Goal.** The finish pass that turns a working app into a comfortable one — the theme resolved on the server so the
first paint is already correct, one form shape and one dialog shape shared across every screen, the marketing landing
page the proposal owes, and a responsive plus keyboard-and-contrast sweep over every dashboard. It sits after the
features because polish is measured against real screens, not mockups; there is nothing here to build that an earlier
step did not already give something to polish.

**Deliverables.**

```
app/layout.tsx                            reads the theme cookie server-side, ships the resolved class on <html> — no flash
lib/theme/                                cookie read/write + resolve(light | dark | system), the server helper the layout calls
components/shared/theme-toggle.tsx        the three-way toggle (light / dark / system), writes the cookie, re-themes without reload
app/globals.css                           @theme inline tokens + the full .dark block, role accents, prefers-reduced-motion
components/**/*.form.tsx                   one form shape — react-hook-form + zod resolver, shared field / label / error primitives
components/**/*.dialog.tsx                 one dialog shape — Base UI, focus trap, labelled title, escape-to-close
app/(marketing)/page.tsx                  the landing page — the product story, the five roles, the entry points
components/{owner,center,supplier,admin}   loading / empty / error states audited across every dashboard route group
```

**Notes.**

- **The theme is resolved on the server, so the first paint is already right.** The layout reads the theme cookie and
  stamps `light` or `dark` on `<html>` before a byte of body renders; there is no client effect that reads the system
  scheme after mount and repaints, because that repaint is the flash. **A theme flash is a bug you shipped to the eyes.**
- **The toggle is three-way, and `system` is a real state, not a default.** Light and dark pin a choice into the
  cookie; `system` clears it and follows the OS, re-resolved on the server on the next navigation — so a user who
  never touches the toggle still gets a correct first paint from `prefers-color-scheme`.
- **Every form and every dialog converge on one shape.** `*.form.tsx` files are all `react-hook-form` over a zod
  resolver with the same field, label, and error primitives; `*.dialog.tsx` files all trap focus and label their
  title — so a screen the grader has never seen still behaves like one they have. Consistency is a feature you feel
  before you can name it.
- **Contrast is measured, not eyeballed.** Every foreground/background and accent token pair is checked at ≥4.5:1 for
  text and ≥3:1 for controls in both schemes; a status badge that is legible on a bright supplier laptop and invisible
  on a dim owner phone is a bug, not a taste.
- **The keyboard path is walked on the flows that carry weight** — registration, booking, checkout — because an owner
  may be one-handed on a phone and an admin lives on the keyboard; focus order, labels, and landmarks are honored, and
  `prefers-reduced-motion` collapses every animation in one block.

**Acceptance criteria.** The step is done when:

- There is no theme flash on first load: the `<html>` class is present in the server-rendered HTML, and reloading in a
  dark-set OS never shows a light frame first.
- Every screen renders correctly in light, dark, and system, and the three-way toggle switches without a full reload
  and persists across navigation via the cookie.
- Every list has an empty state, every async boundary a fallback, and every mutation a toast — audited across all four
  role dashboards and the marketing and auth routes.
- The app is fully navigable by keyboard: focus is visible and ordered, dialogs trap and restore focus, and every
  control has an accessible name, with no low-contrast token pairs remaining.
- `npm run lint` and `npm run build` are green, and `npm run format` reports no changes.

---

<a id="step-20"></a>

### Step 20 — Testing & deployment

**Goal.** Lock quality behind a suite that runs the same way every time, then ship both PM2 apps. This is the last
step: the co-located Vitest unit tests over the pure cores, the `verify:*` integration harnesses and the smoke script
against a live database, the two seed commands, the GitHub Actions pipeline, the standalone build behind a reverse
proxy on port `3104`, the second PM2 app that runs the reminder cron, and the deployment runbook that brings both up.
It sits last because you cannot regression-test features that do not exist, and you cannot deploy a build the gates
have not passed.

**Deliverables.**

```
lib/auth/session.test.ts                          sign / verify round-trip — HS256 pinned, iss / aud / exp checked
lib/utils/money.util.test.ts                      minor-unit conversion + formatting — the totals the marketplace and invoices rest on
lib/services/maintenance/schedule-due.test.ts     computeDue — UPCOMING → DUE → OVERDUE from date and mileage
lib/services/service-request/transition.test.ts   the booking legal-transition guard (PENDING → ACCEPTED → … no skips)
lib/services/order/transition.test.ts             the order legal-transition guard (PENDING → CONFIRMED → … no skips)
lib/storage/file-signature.test.ts                magic-byte acceptance (PNG / JPEG / WebP), SVG refused
scripts/verify-*.ts                               data-model · accounts · vehicles · scheduling · bookings · marketplace · orders · invoices · reports
scripts/smoke.ts                                  runs the verify:* family in sequence against a live database
scripts/seed-super-admin.ts                       the single super administrator, idempotent, from SEED_SUPER_ADMIN_*
scripts/seed-demo.ts                              throwaway demo data — an admin, 2 centers, 2 suppliers, owners, products, a booking, an order
scripts/send-reminders.ts                         the maintenance-reminder cron entrypoint (node-cron)
.github/workflows/ci.yml                          lint → format → build → test on every push and PR
ecosystem.config.js                               two PM2 apps — the web app on 3104 + the reminder cron via cron_restart
next.config.ts                                    output: 'standalone' when VERCEL is unset
docs/DEPLOYMENT.md                                PM2 bring-up, the nginx proxy_set_header, production env, the staging verify run
```

**Notes.**

- **The pure cores are unit-tested because that is where a silent wrong answer hides.** Money conversion, `computeDue`,
  the booking and order transition guards, session verification, and file-signature detection are deterministic and
  get a Vitest table each — a mis-added total or a skipped booking status produces no crash and no log, just a wrong
  answer that ships. **Floating-point money is a bug with a delay on it**, and the money table is the delay's alarm.
- **What needs a database is proven by the `verify:*` harnesses, not mocked.** Each harness runs against a live,
  mutable MongoDB, mutates real documents through the real services, asserts the outcome, and cleans up after itself;
  `smoke` chains them so one command proves every database path in order. A mock proves your mock, not your service.
- **CI gates every merge with the same four steps in the same order.** `lint → format → build → test` runs in GitHub
  Actions on every push and PR, and `build` is the type check because `env/server.ts` is imported by `next.config.ts`
  — an invalid environment fails the build, not runtime. **A gate that runs only on your laptop is not a gate.**
- **The deployment is two PM2 apps, not one.** The web app runs the standalone `server.js` on port `3104` behind a
  reverse proxy that terminates TLS and sets `x-forwarded-for` (which is why `TRUSTED_PROXY` exists and why the runbook
  names the exact `proxy_set_header`); the second app runs `npm run send:reminders` on a `cron_restart`, so a schedule
  that falls DUE reaches the owner without a human in the loop — the worker from [step 8](#step-8) given a home.
- **`ROBOTS_ENABLED` flips to `true` only on the production deploy**, deliberately, so staging never enters an index;
  the runbook points at `.env.example` as the authoritative variable list rather than committing a production env file
  that would invite a real secret into the repository.

**Acceptance criteria.** The step is done when:

- `npm run test` is green — the six co-located Vitest suites (session, money, schedule-due, booking-transition,
  order-transition, file-signature) pass with no database.
- `npm run smoke` passes against a live database, running the nine `verify:*` harnesses in sequence with each cleaning
  up after itself, and `npm run seed:super-admin` is idempotent on a second run.
- The GitHub Actions pipeline passes `lint → format → build → test` on a pull request, and `npm run build:linux`
  produces the standalone artifact from a green `next build`.
- `pm2 start ecosystem.config.js` brings up both apps — the web app answering `curl -I` on port `3104` with the
  security headers, and the reminder app showing as periodically running via `cron_restart` in `pm2 status`.
- `docs/DEPLOYMENT.md` gives the exact PM2 bring-up, the nginx `proxy_set_header X-Forwarded-For` the limiter depends
  on, the production-only variables, and the staging verify run — enough to reproduce the deploy from the doc alone.

---

## Backlog

Real work that is deliberately parked. Each item names the step that surfaced it.

| Item                                | Why it is parked                                                                                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Predictive maintenance              | Reminders are interval-based; mileage-trend prediction needs a model and more history. Surfaced in [step 8](#step-8).                              |
| OBD-II / telematics ingest          | Mileage is entered by the owner; automatic ingest from a device is a separate integration. Surfaced in [step 7](#step-7).                          |
| Fleet / multi-vehicle organizations | Accounts are single-owner; fleet accounts with sub-users need a tenancy model. Surfaced in [step 6](#step-6).                                      |
| Multi-supplier cart                 | An order targets one supplier; a basket spanning suppliers needs order-splitting. Surfaced in [step 12](#step-12).                                 |
| Internationalization                | English-only for now; the [locale] segment and a message pipeline are deferred (the academic sibling carries this). Surfaced in [step 2](#step-2). |
| Per-user notification preferences   | Notifications go to in-app and email; per-user opt-out of the email echo is deferred. Surfaced in [step 15](#step-15).                             |
| Revoking a live session             | Revocation lands within the hour via re-validation; instant revoke needs a sessionVersion. Surfaced in [step 4](#step-4).                          |
| Storybook + Playwright E2E          | Unit + integration harnesses cover the cores; component and end-to-end suites are deferred. Surfaced in [step 20](#step-20).                       |
