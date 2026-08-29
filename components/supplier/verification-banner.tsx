import { TriangleAlert } from 'lucide-react';

type VerificationBannerProps = {
  isVerified: boolean;
};

/** Shown to a supplier until an administrator verifies it: drafts are allowed, but buyers cannot see them yet. */
export function VerificationBanner({ isVerified }: VerificationBannerProps) {
  if (isVerified) {
    return null;
  }

  return (
    <div className="border-warning/40 bg-warning/10 flex items-start gap-3 rounded-lg border p-4">
      <TriangleAlert className="text-warning mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="flex flex-col gap-0.5 text-sm">
        <p className="font-medium">Your business is awaiting verification</p>
        <p className="text-muted-foreground">
          You can list products now, but they stay hidden from buyers until an administrator verifies your account.
        </p>
      </div>
    </div>
  );
}
