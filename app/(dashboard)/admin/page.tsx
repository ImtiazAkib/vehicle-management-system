import { requireAdminArea } from '@/lib/auth';

export default async function AdminHomePage() {
  const user = await requireAdminArea();

  return (
    <section className="flex flex-col gap-2">
      <h1>Administration</h1>
      <p className="text-muted-foreground">
        Welcome, {user.name}. Account governance, service-center and supplier verification, and platform reports land here across steps 6 and 17.
      </p>
    </section>
  );
}
