'use client';

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/*
  A client component because an error boundary needs the `reset` handler wired to a button. The message is
  deliberately generic — the details are in the logs, not on the screen.
*/
export default function DashboardError({ reset }: DashboardErrorProps) {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1>Something went wrong</h1>
      <p className="text-muted-foreground text-sm">This page could not be loaded. Try again in a moment.</p>
      <button type="button" onClick={reset} className="border-border hover:bg-muted rounded-md border px-3 py-1.5 text-sm font-medium">
        Try again
      </button>
    </div>
  );
}
