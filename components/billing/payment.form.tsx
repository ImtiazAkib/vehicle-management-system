'use client';

import { useActionState } from 'react';

import { APP_DATA } from '@/constants/app-data.const';
import { PAYMENT_METHODS } from '@/constants/enums.const';

import { formatMoney } from '@/lib/utils';

import { recordPaymentAction, type FormState } from './actions';

const initial: FormState = { error: null };

const controlClassName =
  'rounded-md border border-input bg-card px-2 py-1 text-xs font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring';

const methodLabel = (value: string): string => {
  const text = value.replace('_', ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

type PaymentFormProps = {
  invoiceId: string;
  defaultAmount: number;
};

export function PaymentForm({ invoiceId, defaultAmount }: PaymentFormProps) {
  const [state, formAction, pending] = useActionState(recordPaymentAction, initial);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="invoiceId" value={invoiceId} />

      <label className="flex flex-col gap-1 text-xs font-medium">
        Amount ({APP_DATA.CURRENCY.SYMBOL})
        <input
          type="text"
          name="amount"
          inputMode="decimal"
          defaultValue={formatMoney(defaultAmount)}
          required
          className={`${controlClassName} w-24`}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium">
        Method
        <select name="method" required defaultValue={PAYMENT_METHODS.CASH} className={controlClassName}>
          {Object.values(PAYMENT_METHODS).map(value => (
            <option key={value} value={value}>
              {methodLabel(value)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium">
        Reference (optional)
        <input type="text" name="transactionRef" className={controlClassName} />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="bg-primary text-primary-foreground hover:bg-primary-hover rounded-md px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60">
        {pending ? 'Recording…' : 'Record payment'}
      </button>

      {state.error && <p className="text-destructive w-full text-xs">{state.error}</p>}
    </form>
  );
}
