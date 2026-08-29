import { requireAdminArea } from '@/lib/auth';
import { ReportService } from '@/lib/services';
import { formatPriceLabel } from '@/lib/utils';

import { StatTile } from '@/components/dashboard';
import { PageHeader } from '@/components/shared';

const reportService = new ReportService();

export default async function AdminReportsPage() {
  await requireAdminArea();
  const overview = (await reportService.adminPlatformOverview()).result;

  if (!overview) {
    return (
      <section className="flex flex-col gap-6">
        <PageHeader title="Reports" description="The platform-wide overview." />
        <p className="text-muted-foreground">The report is not available right now.</p>
      </section>
    );
  }

  const bars = [
    { label: 'Owners', value: overview.ownerCount, fill: 'fill-accent-blue' },
    { label: 'Centers', value: overview.centerCount, fill: 'fill-accent-teal' },
    { label: 'Suppliers', value: overview.supplierCount, fill: 'fill-accent-amber' },
  ];
  const max = Math.max(1, ...bars.map(bar => bar.value));

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Reports" description="The platform-wide overview — counts and settled revenue across every account." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Owners" value={String(overview.ownerCount)} />
        <StatTile label="Service centers" value={String(overview.centerCount)} />
        <StatTile label="Suppliers" value={String(overview.supplierCount)} />
        <StatTile label="Vehicles" value={String(overview.vehicleCount)} />
        <StatTile label="Bookings" value={String(overview.bookingCount)} />
        <StatTile label="Orders" value={String(overview.orderCount)} />
        <StatTile label="Revenue" value={formatPriceLabel(overview.revenue)} hint="settled invoices" />
      </div>

      <div className="surface-card flex flex-col gap-3 p-6">
        <h2 className="text-sm font-semibold">Accounts by role</h2>
        <div className="overflow-x-auto">
          <svg viewBox="0 0 360 200" className="max-w-lg min-w-90" role="img" aria-label="Accounts by role">
            {bars.map((bar, index) => {
              const barHeight = (bar.value / max) * 140;
              const x = 40 + index * 100;
              const y = 160 - barHeight;

              return (
                <g key={bar.label}>
                  <rect x={x} y={y} width={60} height={barHeight} rx={4} className={bar.fill} />
                  <text x={x + 30} y={177} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                    {bar.label}
                  </text>
                  <text x={x + 30} y={y - 6} textAnchor="middle" className="fill-foreground text-[11px] font-semibold">
                    {bar.value}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </section>
  );
}
