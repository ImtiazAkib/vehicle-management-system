/*
  The landing page's list content. Copy normally lives as a literal in the component that renders it —
  that is this project's rule and it holds everywhere else. These four lists are the exception, and for
  one concrete reason: `/llms.txt` and `/llms-full.txt` (step 2) restate them, so the strings have a
  second consumer. Inline would mean the descriptions maintained in two files, which is exactly the drift
  a second copy invites. The landing UI (step 19) enriches these with icons at the call site; the pure
  data lives here so the crawler documents cannot disagree with the page.
*/

export const ROLES = [
  {
    title: 'Administrator',
    summary: 'Governs the perimeter — verifies service centers and suppliers, oversees accounts, and reads the platform-wide reports.',
    capabilities: [
      'Verify and approve service centers and suppliers',
      'Activate or deactivate any account',
      'Read the platform-wide reports',
      'Never books, sells, ships or invoices on anyone’s behalf',
    ],
  },
  {
    title: 'Vehicle owner',
    summary: 'Keeps their vehicles, schedules and history in one place, books services and orders supplies.',
    capabilities: [
      'Register and manage their own vehicles',
      'Set maintenance schedules and receive reminders',
      'Book services from verified centers',
      'Order supplies and pay invoices',
    ],
  },
  {
    title: 'Service center',
    summary: 'Receives and works assigned service requests, records the maintenance and issues the invoice.',
    capabilities: [
      'Accept, decline and progress assigned requests',
      'Record the maintenance performed',
      'Issue service invoices',
      'Message the owner about a booking',
    ],
  },
  {
    title: 'Supplier',
    summary: 'Lists utility supplies once verified, manages stock and fulfills owner orders.',
    capabilities: [
      'List products and manage stock',
      'Fulfill orders through their transitions',
      'Issue order invoices',
      'Transactable only after admin verification',
    ],
  },
] as const;

export const FEATURES = [
  {
    title: 'Vehicle records',
    description:
      'Every vehicle owns its own profile and service history — make, VIN, mileage and the work done on it — so no receipt is lost and no service date lives only in someone’s memory.',
  },
  {
    title: 'Maintenance scheduler',
    description:
      'Schedules driven by time and mileage that compute the next due date and remind before it lapses, dispatched by a cron worker that survives a missed run rather than an in-process timer.',
  },
  {
    title: 'Service booking',
    description:
      'Owners book work against verified service centers, and every status change moves through a guarded transition — accept, start, complete — never a raw write.',
  },
  {
    title: 'Utility marketplace',
    description:
      'Verified suppliers list parts and consumables; owners order them with stock decremented atomically, so the last tire sells once and an oversell is impossible under load.',
  },
  {
    title: 'Invoices and payments',
    description:
      'Billing for both services and orders in integer minor units — no float in the money path — with payments recorded in the database and invoices marked paid, no external gateway.',
  },
  {
    title: 'Messaging and notifications',
    description: 'Owner-to-center messaging scoped to a booking, and notifications that surface in-app and by email as the domain events happen.',
  },
] as const;

export const TECH_STACK = [
  { label: 'Next.js 16', role: 'App Router — server rendering and route handlers together' },
  { label: 'React 19', role: 'Server Components by default; client only where state lives' },
  { label: 'TypeScript', role: 'Strict. No implicit any, no unchecked casts into a DTO' },
  { label: 'Tailwind CSS v4', role: 'Design tokens, and every class checked against them' },
  { label: 'MongoDB', role: 'Document-shaped vehicle, booking and order records with real indexes' },
  { label: 'Mongoose', role: 'Schemas, hooks and the indexes that enforce the rules' },
] as const;

export const ROADMAP_PHASES = [
  { phase: 'Phase 1', title: 'Requirement analysis', description: 'The proposal turned into a step-by-step plan', weeks: 'Week 1' },
  { phase: 'Phase 2', title: 'System design', description: 'Toolchain, design system, data model and the SEO surface', weeks: 'Week 1–2' },
  {
    phase: 'Phase 3',
    title: 'Backend',
    description: 'Authentication, accounts, vehicles, scheduling, booking and the marketplace',
    weeks: 'Week 2–4',
  },
  { phase: 'Phase 4', title: 'Frontend', description: 'Role dashboards, booking and ordering flows, and the owner surface', weeks: 'Week 4–5' },
  { phase: 'Phase 5', title: 'Integration', description: 'Invoices and payments, messaging, notifications, reviews and reports', weeks: 'Week 5–6' },
  { phase: 'Phase 6', title: 'Hardening', description: 'Security headers, rate limits, the polish pass and the smoke path', weeks: 'Week 6' },
  { phase: 'Phase 7', title: 'Deployment', description: 'A clean clone reaching a running production build under PM2', weeks: 'Week 6+' },
  { phase: 'Phase 8', title: 'Documentation', description: 'README, the visual walkthrough and the deployment runbook', weeks: 'Week 6+' },
] as const;
