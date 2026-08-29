import { toId } from '@/lib/utils';

import type { PaymentMethod, PaymentStatus } from './enums';
import type { PaymentEntity } from '@/models/payment.model';

export type PaymentDto = {
  paymentId: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function paymentFromEntity(entity: PaymentEntity): PaymentDto {
  return {
    paymentId: toId(entity._id),
    invoiceId: toId(entity.invoice),
    amount: entity.amount,
    method: entity.method,
    status: entity.status,
    transactionRef: entity.transactionRef ?? null,
    paidAt: entity.paidAt ? entity.paidAt.toISOString() : null,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
