import Link from 'next/link';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';
import { ReportService } from '@/lib/services';
import { formatPriceLabel } from '@/lib/utils';

import { StatTile } from '@/components/dashboard';
import { PageHeader } from '@/components/shared';

const reportService = new ReportService();

const LINKS = [
  { href: ROUTES.SUPPLIER_PRODUCTS.HREF, title: 'Products', summary: 'List parts and consumables and manage their stock.' },
  { href: ROUTES.SUPPLIER_ORDERS.HREF, title: 'Orders', summary: 'Work your fulfillment queue from placed to delivered.' },
  { href: ROUTES.SUPPLIER_INVOICES.HREF, title: 'Invoices', summary: 'Bill your orders and track what is owed.' },
  { href: ROUTES.SUPPLIER_PROFILE.HREF, title: 'Supplier profile', summary: 'The business details buyers see when browsing.' },
] as const;

export default async function SupplierHomePage() {
  const user = await requireRole(USER_ROLES.SUPPLIER);
  const report = (await reportService.supplierSales(user.userId)).result;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={`Welcome, ${user.name}`} description="List your catalog, keep stock honest, and fulfill orders once buyers place them." />

      {report && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Orders" value={String(report.orderCount)} />
          <StatTile label="Delivered" value={String(report.deliveredCount)} hint={`${report.deliveredCount} of ${report.orderCount}`} />
          <StatTile label="Units sold" value={String(report.unitsSold)} />
          <StatTile label="Revenue" value={formatPriceLabel(report.revenue)} hint="delivered orders" />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {LINKS.map(link => (
          <Link key={link.href} href={link.href} className="surface-card hover:bg-muted flex flex-col gap-0.5 p-5 transition-colors">
            <span className="text-sm font-semibold">{link.title}</span>
            <span className="text-muted-foreground text-sm">{link.summary}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
