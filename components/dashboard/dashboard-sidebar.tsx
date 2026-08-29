import type { Route } from 'next';

import Link from 'next/link';

import {
  BarChart3,
  CalendarCheck,
  Car,
  ClipboardList,
  Home,
  MessageSquare,
  Package,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  User as UserIcon,
  Users,
  Wrench,
} from 'lucide-react';

import { UserRole } from '@/types';

import { APP_DATA } from '@/constants/app-data.const';
import { ROLE_HOME, ROUTES } from '@/constants/routes.const';

import { cn } from '@/lib/utils';

/*
  The role-specific middle of the nav — the feature areas a role owns. Each entry lands as the step that
  builds its page does, so a `<Link>` never points at a route `typedRoutes` has not seen. Home and Profile
  bracket these for every role.
*/
const ROLE_NAV: Partial<Record<UserRole, { label: string; href: Route; icon: typeof Home }[]>> = {
  owner: [
    { label: ROUTES.OWNER_VEHICLES.LABEL, href: ROUTES.OWNER_VEHICLES.HREF, icon: Car },
    { label: ROUTES.OWNER_SCHEDULES.LABEL, href: ROUTES.OWNER_SCHEDULES.HREF, icon: Wrench },
    { label: ROUTES.OWNER_BOOKINGS.LABEL, href: ROUTES.OWNER_BOOKINGS.HREF, icon: CalendarCheck },
    { label: ROUTES.OWNER_MARKETPLACE.LABEL, href: ROUTES.OWNER_MARKETPLACE.HREF, icon: ShoppingCart },
    { label: ROUTES.OWNER_ORDERS.LABEL, href: ROUTES.OWNER_ORDERS.HREF, icon: ShoppingBag },
    { label: ROUTES.OWNER_INVOICES.LABEL, href: ROUTES.OWNER_INVOICES.HREF, icon: ReceiptText },
    { label: ROUTES.OWNER_MESSAGES.LABEL, href: ROUTES.OWNER_MESSAGES.HREF, icon: MessageSquare },
  ],
  supplier: [
    { label: ROUTES.SUPPLIER_PRODUCTS.LABEL, href: ROUTES.SUPPLIER_PRODUCTS.HREF, icon: Package },
    { label: ROUTES.SUPPLIER_ORDERS.LABEL, href: ROUTES.SUPPLIER_ORDERS.HREF, icon: ClipboardList },
    { label: ROUTES.SUPPLIER_INVOICES.LABEL, href: ROUTES.SUPPLIER_INVOICES.HREF, icon: ReceiptText },
    { label: ROUTES.SUPPLIER_PROFILE.LABEL, href: ROUTES.SUPPLIER_PROFILE.HREF, icon: Store },
  ],
  'service-center': [
    { label: ROUTES.CENTER_REQUESTS.LABEL, href: ROUTES.CENTER_REQUESTS.HREF, icon: ClipboardList },
    { label: ROUTES.CENTER_RECORDS.LABEL, href: ROUTES.CENTER_RECORDS.HREF, icon: Wrench },
    { label: ROUTES.CENTER_INVOICES.LABEL, href: ROUTES.CENTER_INVOICES.HREF, icon: ReceiptText },
    { label: ROUTES.CENTER_MESSAGES.LABEL, href: ROUTES.CENTER_MESSAGES.HREF, icon: MessageSquare },
    { label: ROUTES.CENTER_PROFILE.LABEL, href: ROUTES.CENTER_PROFILE.HREF, icon: Store },
  ],
  admin: [
    { label: ROUTES.ADMIN_USERS.LABEL, href: ROUTES.ADMIN_USERS.HREF, icon: Users },
    { label: ROUTES.ADMIN_VERIFICATIONS.LABEL, href: ROUTES.ADMIN_VERIFICATIONS.HREF, icon: ShieldCheck },
    { label: ROUTES.ADMIN_REPORTS.LABEL, href: ROUTES.ADMIN_REPORTS.HREF, icon: BarChart3 },
  ],
  'super-admin': [
    { label: ROUTES.ADMIN_USERS.LABEL, href: ROUTES.ADMIN_USERS.HREF, icon: Users },
    { label: ROUTES.ADMIN_VERIFICATIONS.LABEL, href: ROUTES.ADMIN_VERIFICATIONS.HREF, icon: ShieldCheck },
    { label: ROUTES.ADMIN_REPORTS.LABEL, href: ROUTES.ADMIN_REPORTS.HREF, icon: BarChart3 },
  ],
};

export type DashboardShellUser = {
  name: string;
  roleLabel: string;
  initials: string;
  accentClassName: string;
};

type DashboardSidebarProps = {
  role: UserRole;
  user: DashboardShellUser;
};

/*
  The nav is deliberately short at step 5 — the role home and the shared profile, the only two routes that
  exist. Each feature step adds its own entry here as the page it links to lands, so a `<Link>` never
  points at a route `typedRoutes` has not seen.
*/
export function DashboardSidebar({ role, user }: DashboardSidebarProps) {
  const navItems = [
    { label: 'Home', href: ROLE_HOME[role], icon: Home },
    ...(ROLE_NAV[role] ?? []),
    { label: 'Profile', href: ROUTES.PROFILE.HREF, icon: UserIcon },
  ];

  return (
    <aside className="border-border bg-sidebar text-sidebar-foreground flex shrink-0 flex-col border-b lg:h-dvh lg:w-64 lg:border-r lg:border-b-0">
      <div className="flex items-center gap-2 px-4 py-4">
        <span className="font-heading text-lg font-semibold tracking-tight">{APP_DATA.SHORT_NAME}</span>
      </div>

      <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-1 px-2">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium">
            <item.icon className="size-4" aria-hidden />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-border flex items-center gap-3 border-t px-4 py-3">
        <span className={cn('bg-muted flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold', user.accentClassName)}>
          {user.initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className={cn('truncate text-xs', user.accentClassName)}>{user.roleLabel}</p>
        </div>
      </div>
    </aside>
  );
}
