import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';
import { ServiceCenterService } from '@/lib/services';

import { CenterProfileForm } from '@/components/center';

const centerService = new ServiceCenterService();

export default async function CenterProfilePage() {
  const center = await requireRole(USER_ROLES.SERVICE_CENTER);
  const result = await centerService.getOwnProfile(center.userId);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1>Center profile</h1>
        <p className="text-muted-foreground">The details owners see when they book you. Verification status is set by an administrator.</p>
      </div>

      {result.success && result.result ? (
        <CenterProfileForm profile={result.result} />
      ) : (
        <p className="text-muted-foreground">Your center profile is not available yet.</p>
      )}
    </section>
  );
}
