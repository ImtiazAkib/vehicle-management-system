/*
  Report read-models — counts and integer minor-unit money, never PII. Each is built by `ReportService`
  from live aggregation pipelines; there is no rollup table to drift from the rows it summarizes. Every rate
  ships beside the count it divides.
*/

export type OwnerReportDto = {
  vehicleCount: number;
  scheduleCount: number;
  dueSoonCount: number;
  totalSpend: number;
};

export type CenterReportDto = {
  requestCount: number;
  completedCount: number;
  completionRate: number;
  revenue: number;
};

export type TopProductDto = {
  productId: string;
  name: string;
  units: number;
};

export type SupplierReportDto = {
  orderCount: number;
  deliveredCount: number;
  fulfillmentRate: number;
  unitsSold: number;
  revenue: number;
  topProducts: TopProductDto[];
};

export type AdminReportDto = {
  ownerCount: number;
  centerCount: number;
  supplierCount: number;
  vehicleCount: number;
  bookingCount: number;
  orderCount: number;
  revenue: number;
};
