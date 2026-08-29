import Link from 'next/link';

import {
  ArrowRight,
  Building2,
  Calendar,
  Car,
  Check,
  MessagesSquare,
  Package,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  Store,
  Wrench,
} from 'lucide-react';

import { env } from '@/env/server';

import { APP_DATA } from '@/constants/app-data.const';
import { FEATURES, ROADMAP_PHASES, ROLES, TECH_STACK } from '@/constants/home.const';
import { buildJsonLdGraph } from '@/constants/json-ld.const';
import { ROUTES, SECTION_IDS } from '@/constants/routes.const';

import { SiteFooter, SiteHeader } from '@/components/marketing';
import { JsonLd } from '@/components/shared';

import type { LucideIcon } from 'lucide-react';

/*
  The marketing landing page — the product story, the four roles, the features, the stack and the build
  roadmap, above the sign-in / register entry points. The copy is the single source in `home.const.ts`
  (the crawler surface restates the same strings), enriched with icons and the design-token accents here.
*/

// Aligned to the ROLES order: administrator, vehicle owner, service center, supplier.
const ROLE_META: { icon: LucideIcon; accent: string; tint: string }[] = [
  { icon: ShieldCheck, accent: 'text-accent-violet', tint: 'bg-accent-violet/10' },
  { icon: Car, accent: 'text-accent-blue', tint: 'bg-accent-blue/10' },
  { icon: Wrench, accent: 'text-accent-teal', tint: 'bg-accent-teal/10' },
  { icon: Store, accent: 'text-accent-amber', tint: 'bg-accent-amber/10' },
];

// Aligned to the FEATURES order.
const FEATURE_ICONS: LucideIcon[] = [Car, Calendar, ShieldCheck, ShoppingCart, ReceiptText, MessagesSquare];

const HERO_HIGHLIGHTS = [
  { icon: Car, label: 'Vehicle owners' },
  { icon: Wrench, label: 'Service centers' },
  { icon: Package, label: 'Suppliers' },
  { icon: Building2, label: 'Administrators' },
];

export default function HomePage() {
  const jsonLd = buildJsonLdGraph({ baseUrl: env.APP_BASE_URL, description: APP_DATA.DESCRIPTION });

  return (
    <div className="flex min-h-dvh flex-col">
      <JsonLd data={jsonLd} />
      <SiteHeader />

      <main id="main-content" tabIndex={-1} className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="bg-primary-muted pointer-events-none absolute -top-40 left-1/2 size-152 -translate-x-1/2 rounded-full opacity-60 blur-3xl"
          />
          <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-20 text-center lg:py-28">
            <span className="border-border bg-card/60 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
              <span className="bg-success size-1.5 rounded-full" aria-hidden />
              Vehicle utilities · supply &amp; maintenance
            </span>

            <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">{APP_DATA.TAGLINE}</h1>

            <p className="text-muted-foreground max-w-2xl text-lg text-pretty">{APP_DATA.DESCRIPTION}</p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={ROUTES.REGISTER.HREF}
                className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold transition-colors">
                Get started
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href={ROUTES.SIGN_IN.HREF}
                className="border-border hover:bg-muted inline-flex items-center justify-center gap-2 rounded-md border px-6 py-3 text-sm font-semibold transition-colors">
                Sign in
              </Link>
            </div>

            <div className="text-muted-foreground mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              {HERO_HIGHLIGHTS.map(item => (
                <span key={item.label} className="inline-flex items-center gap-2">
                  <item.icon className="size-4" aria-hidden />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Roles */}
        <section id={SECTION_IDS.ROLES} className="border-border scroll-mt-16 border-t">
          <div className="mx-auto max-w-6xl px-4 py-16 lg:px-6 lg:py-24">
            <div className="flex max-w-2xl flex-col gap-3">
              <p className="tagline text-primary">Roles</p>
              <h2>One platform, four roles</h2>
              <p className="text-muted-foreground">
                Access is decided by role, not convention — and nobody transacts until an administrator has vouched for them.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {ROLES.map((role, index) => {
                const meta = ROLE_META[index] ?? ROLE_META[0];
                const Icon = meta.icon;

                return (
                  <article key={role.title} className="surface-card flex flex-col gap-4 p-6">
                    <div className="flex items-center gap-3">
                      <span className={`grid size-10 place-items-center rounded-lg ${meta.tint} ${meta.accent}`}>
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <h3 className="text-card-title">{role.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">{role.summary}</p>
                    <ul className="flex flex-col gap-2">
                      {role.capabilities.map(capability => (
                        <li key={capability} className="flex items-start gap-2 text-sm">
                          <Check className={`mt-0.5 size-4 shrink-0 ${meta.accent}`} aria-hidden />
                          <span>{capability}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id={SECTION_IDS.FEATURES} className="border-border bg-surface-muted scroll-mt-16 border-t">
          <div className="mx-auto max-w-6xl px-4 py-16 lg:px-6 lg:py-24">
            <div className="flex max-w-2xl flex-col gap-3">
              <p className="tagline text-primary">Features</p>
              <h2>Everything the workflow needs</h2>
              <p className="text-muted-foreground">From a vehicle profile to a settled invoice, each part of the job has a home.</p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, index) => {
                const Icon = FEATURE_ICONS[index] ?? Car;

                return (
                  <article key={feature.title} className="surface-card flex flex-col gap-3 p-6">
                    <span className="bg-primary-muted text-primary grid size-10 place-items-center rounded-lg">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <h3 className="text-card-title">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Stack */}
        <section id={SECTION_IDS.STACK} className="border-border scroll-mt-16 border-t">
          <div className="mx-auto max-w-6xl px-4 py-16 lg:px-6 lg:py-24">
            <div className="flex max-w-2xl flex-col gap-3">
              <p className="tagline text-primary">Stack</p>
              <h2>Built on a modern stack</h2>
              <p className="text-muted-foreground">Server-first Next.js, a typed domain model, and correctness enforced by indexes and schemas.</p>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TECH_STACK.map(item => (
                <div key={item.label} className="surface-card flex flex-col gap-1 p-5">
                  <span className="text-sm font-semibold">{item.label}</span>
                  <span className="text-muted-foreground text-sm">{item.role}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section id={SECTION_IDS.ROADMAP} className="border-border bg-surface-muted scroll-mt-16 border-t">
          <div className="mx-auto max-w-6xl px-4 py-16 lg:px-6 lg:py-24">
            <div className="flex max-w-2xl flex-col gap-3">
              <p className="tagline text-primary">Roadmap</p>
              <h2>The build, in phases</h2>
              <p className="text-muted-foreground">
                Each phase leaves the app in a working, shippable state — the plan is executed one step at a time.
              </p>
            </div>

            <ol className="mt-10 flex flex-col gap-3">
              {ROADMAP_PHASES.map(phase => (
                <li key={phase.phase} className="surface-card flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:gap-6">
                  <div className="flex items-center gap-3 sm:w-56 sm:shrink-0">
                    <span className="bg-primary-muted text-primary rounded-md px-2 py-1 text-xs font-semibold">{phase.phase}</span>
                    <span className="font-semibold">{phase.title}</span>
                  </div>
                  <p className="text-muted-foreground flex-1 text-sm">{phase.description}</p>
                  <span className="text-muted-foreground text-xs font-medium sm:text-right">{phase.weeks}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="border-border border-t">
          <div className="mx-auto max-w-6xl px-4 py-16 lg:px-6 lg:py-24">
            <div className="bg-primary text-primary-foreground flex flex-col items-center gap-6 rounded-2xl px-6 py-14 text-center">
              <h2 className="text-primary-foreground max-w-2xl text-balance">Ready to keep every vehicle on the road?</h2>
              <p className="max-w-xl text-sm opacity-90">
                Create an account as an owner, a service center or a supplier — administrators verify the businesses before they transact.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={ROUTES.REGISTER.HREF}
                  className="text-primary inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90">
                  Get started
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                  href={ROUTES.SIGN_IN.HREF}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-white/30 px-6 py-3 text-sm font-semibold transition-colors hover:bg-white/10">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
