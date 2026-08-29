import type {
  FuelType,
  InvoiceStatus,
  InvoiceType,
  MaintenanceScheduleStatus,
  NotificationChannel,
  OrderPaymentStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductCategory,
  ReviewTargetType,
  ServiceRequestPriority,
  ServiceRequestStatus,
  Transmission,
} from '@/types';

/*
  The value objects behind the unions in `types/enums.ts`. Models read `Object.values(...)` for their
  `enum:` lists and services compare against these keys, so the stored strings have exactly one source.
  `as const satisfies Record<string, X>` keeps the literals while making a typo a compile error.
*/

export const FUEL_TYPES = {
  PETROL: 'PETROL',
  DIESEL: 'DIESEL',
  ELECTRIC: 'ELECTRIC',
  HYBRID: 'HYBRID',
  CNG: 'CNG',
} as const satisfies Record<string, FuelType>;

export const TRANSMISSIONS = {
  MANUAL: 'MANUAL',
  AUTOMATIC: 'AUTOMATIC',
} as const satisfies Record<string, Transmission>;

export const MAINTENANCE_SCHEDULE_STATUSES = {
  UPCOMING: 'UPCOMING',
  DUE: 'DUE',
  OVERDUE: 'OVERDUE',
  COMPLETED: 'COMPLETED',
} as const satisfies Record<string, MaintenanceScheduleStatus>;

export const SERVICE_REQUEST_STATUSES = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const satisfies Record<string, ServiceRequestStatus>;

export const SERVICE_REQUEST_PRIORITIES = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const satisfies Record<string, ServiceRequestPriority>;

export const PRODUCT_CATEGORIES = {
  OIL: 'OIL',
  FILTER: 'FILTER',
  TIRE: 'TIRE',
  BATTERY: 'BATTERY',
  BRAKE: 'BRAKE',
  WIPER: 'WIPER',
  COOLANT: 'COOLANT',
  ACCESSORY: 'ACCESSORY',
  OTHER: 'OTHER',
} as const satisfies Record<string, ProductCategory>;

export const ORDER_STATUSES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PACKED: 'PACKED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const satisfies Record<string, OrderStatus>;

export const ORDER_PAYMENT_STATUSES = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
} as const satisfies Record<string, OrderPaymentStatus>;

export const INVOICE_TYPES = {
  SERVICE: 'SERVICE',
  ORDER: 'ORDER',
} as const satisfies Record<string, InvoiceType>;

export const INVOICE_STATUSES = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const satisfies Record<string, InvoiceStatus>;

export const PAYMENT_METHODS = {
  CARD: 'CARD',
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
  WALLET: 'WALLET',
} as const satisfies Record<string, PaymentMethod>;

export const PAYMENT_STATUSES = {
  PENDING: 'PENDING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const satisfies Record<string, PaymentStatus>;

export const NOTIFICATION_CHANNELS = {
  IN_APP: 'IN_APP',
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH: 'PUSH',
} as const satisfies Record<string, NotificationChannel>;

export const REVIEW_TARGET_TYPES = {
  SERVICE_CENTER: 'SERVICE_CENTER',
  SUPPLIER: 'SUPPLIER',
  PRODUCT: 'PRODUCT',
} as const satisfies Record<string, ReviewTargetType>;
