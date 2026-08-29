import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';
import { ServiceCenterService } from '@/lib/services';

import { CenterProfileForm } from '@/components/center';
import { PageHeader } from '@/components/shared';

const centerService = new ServiceCenterService();

export default async function CenterProfilePage() {
  const center = await requireRole(USER_ROLES.SERVICE_CENTER);
  const result = await centerService.getOwnProfile(center.userId);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Center profile" description="The details owners see when they book you. Verification status is set by an administrator." />

      {result.success && result.result ? (
        <CenterProfileForm profile={result.result} />
      ) : (
        <p className="text-muted-foreground">Your center profile is not available yet.</p>
      )}
    </section>
  );
}
