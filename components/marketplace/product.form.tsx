'use client';

import { useActionState } from 'react';

import { APP_DATA } from '@/constants/app-data.const';
import { PRODUCT_CATEGORIES } from '@/constants/enums.const';

import { Field, SubmitButton } from '@/components/auth/field';

import { createProductAction, type FormState } from './actions';

const initial: FormState = { error: null };

const selectClassName =
  'w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring';

const categoryLabel = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

export function ProductForm() {
  const [state, formAction, pending] = useActionState(createProductAction, initial);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <Field label="Name" name="name" placeholder="Synthetic engine oil 5W-30" required />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Category
          <select name="category" required className={selectClassName} defaultValue={PRODUCT_CATEGORIES.OIL}>
            {Object.values(PRODUCT_CATEGORIES).map(value => (
              <option key={value} value={value}>
                {categoryLabel(value)}
              </option>
            ))}
          </select>
        </label>

        <Field label="SKU" name="sku" placeholder="OIL-5W30-1L" required />
        <Field label={`Price (${APP_DATA.CURRENCY.SYMBOL})`} name="price" inputMode="decimal" placeholder="0.00" required />
        <Field label="Stock quantity" name="stockQuantity" type="number" inputMode="numeric" defaultValue={0} required />
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Description (optional)
        <textarea
          name="description"
          rows={3}
          className="border-input bg-card text-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2"
        />
      </label>

      {state.error && <p className="text-destructive text-sm">{state.error}</p>}

      <SubmitButton pending={pending}>{pending ? 'Listing…' : 'List product'}</SubmitButton>
    </form>
  );
}
