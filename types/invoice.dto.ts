import { toId } from '@/lib/utils';

import type { InvoiceStatus, InvoiceType } from './enums';
import type { InvoiceEntity } from '@/models/invoice.model';

export type InvoiceDto = {
  invoiceId: string;
  type: InvoiceType;
  referenceId: string;
  ownerId: string;
  issuedById: string;
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  issuedAt: string;
  dueDate: string;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function invoiceFromEntity(entity: InvoiceEntity): InvoiceDto {
  return {
    invoiceId: toId(entity._id),
    type: entity.type,
    referenceId: toId(entity.reference),
    ownerId: toId(entity.owner),
    issuedById: toId(entity.issuedBy),
    subtotal: entity.subtotal,
    tax: entity.tax,
    total: entity.total,
    status: entity.status,
    issuedAt: entity.issuedAt.toISOString(),
    dueDate: entity.dueDate.toISOString(),
    paidAt: entity.paidAt ? entity.paidAt.toISOString() : null,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
