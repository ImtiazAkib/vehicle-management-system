import type { ReactNode } from 'react';

type AuthCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

/** The card every auth screen sits in — one title, an optional line under it, the form, and a footer link. */
export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <div className="surface-card p-6">
        <h1>{title}</h1>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}
