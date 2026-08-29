'use client';

import { useActionState } from 'react';

import { Field, SubmitButton } from '@/components/auth/field';

import { createOrderAction, type FormState } from './actions';

const initial: FormState = { error: null };

type CheckoutFormProps = {
  productId: string;
  supplierId: string;
  maxQuantity: number;
};

export function CheckoutForm({ productId, supplierId, maxQuantity }: CheckoutFormProps) {
  const [state, formAction, pending] = useActionState(createOrderAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="supplierId" value={supplierId} />

      <Field label="Quantity" name="quantity" type="number" inputMode="numeric" defaultValue={1} min={1} max={maxQuantity} required />
      <Field label="Delivery address" name="line1" required />
      <Field label="Address line 2 (optional)" name="line2" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" name="city" required />
        <Field label="Postal code (optional)" name="postalCode" />
      </div>

      <Field label="Phone (optional)" name="phone" inputMode="tel" />

      {state.error && <p className="text-destructive text-sm">{state.error}</p>}

      <SubmitButton pending={pending}>{pending ? 'Placing…' : 'Place order'}</SubmitButton>
    </form>
  );
}
