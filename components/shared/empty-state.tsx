import type { ReactNode } from 'react';

import type { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
};

/** The shared "nothing here yet" panel — a dashed surface with an optional icon, a line, and an optional call to action. */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="border-border flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
      {Icon && (
        <span className="bg-muted text-muted-foreground grid size-11 place-items-center rounded-full">
          <Icon className="size-5" aria-hidden />
        </span>
      )}
      <div className="flex flex-col gap-1">
        <p className="font-medium">{title}</p>
        {description && <p className="text-muted-foreground mx-auto max-w-md text-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}
