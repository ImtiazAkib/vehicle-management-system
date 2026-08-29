/*
  The closed value sets the data model and API share. Each is a literal union here and a matching value
  object in `constants/enums.const.ts`, so a model's `enum:` list and a DTO's field type cannot drift.
  Values are UPPER_SNAKE_CASE and are the exact strings stored in Mongo and returned by the API.
*/

// Vehicle
export type FuelType = 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'CNG';
export type Transmission = 'MANUAL' | 'AUTOMATIC';

// Maintenance
export type MaintenanceScheduleStatus = 'UPCOMING' | 'DUE' | 'OVERDUE' | 'COMPLETED';

// Service booking
export type ServiceRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ServiceRequestPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

// Marketplace
export type ProductCategory = 'OIL' | 'FILTER' | 'TIRE' | 'BATTERY' | 'BRAKE' | 'WIPER' | 'COOLANT' | 'ACCESSORY' | 'OTHER';

// Orders
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type OrderPaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

// Billing
export type InvoiceType = 'SERVICE' | 'ORDER';
export type InvoiceStatus = 'UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type PaymentMethod = 'CARD' | 'CASH' | 'BANK_TRANSFER' | 'WALLET';
export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';

// Notifications
export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';

// Reviews
export type ReviewTargetType = 'SERVICE_CENTER' | 'SUPPLIER' | 'PRODUCT';
