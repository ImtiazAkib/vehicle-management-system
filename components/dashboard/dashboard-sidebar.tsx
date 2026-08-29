import Link from 'next/link';

import { Home, User as UserIcon } from 'lucide-react';

import { UserRole } from '@/types';

import { APP_DATA } from '@/constants/app-data.const';
import { ROLE_HOME, ROUTES } from '@/constants/routes.const';

import { cn } from '@/lib/utils';

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
