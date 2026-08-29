import Link from 'next/link';

import { APP_DATA } from '@/constants/app-data.const';
import { PRODUCT_CATEGORIES } from '@/constants/enums.const';
import { ROUTES } from '@/constants/routes.const';

type ProductFiltersProps = {
  category?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
};

const controlClassName =
  'rounded-md border border-input bg-card px-3 py-2 text-sm font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring';

const categoryLabel = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

/*
  A plain GET form — submitting it navigates to the same route with the filters in the query string, so the
  filtered view is a link you can paste and the state survives a reload. No client state, no `page` carried
  (a new filter starts at page one).
*/
export function ProductFilters({ category, q, minPrice, maxPrice }: ProductFiltersProps) {
  return (
    <form method="get" className="surface-card flex flex-wrap items-end gap-3 p-4">
      <label className="flex flex-1 flex-col gap-1 text-xs font-medium">
        Search
        <input type="text" name="q" defaultValue={q} placeholder="Name…" className={controlClassName} />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium">
        Category
        <select name="category" defaultValue={category ?? ''} className={controlClassName}>
          <option value="">All</option>
          {Object.values(PRODUCT_CATEGORIES).map(value => (
            <option key={value} value={value}>
              {categoryLabel(value)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium">
        Min ({APP_DATA.CURRENCY.SYMBOL})
        <input type="text" name="minPrice" inputMode="decimal" defaultValue={minPrice} placeholder="0" className={`${controlClassName} w-24`} />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium">
        Max ({APP_DATA.CURRENCY.SYMBOL})
        <input type="text" name="maxPrice" inputMode="decimal" defaultValue={maxPrice} placeholder="0" className={`${controlClassName} w-24`} />
      </label>

      <button
        type="submit"
        className="bg-primary text-primary-foreground hover:bg-primary-hover rounded-md px-4 py-2 text-sm font-semibold transition-colors">
        Filter
      </button>
      <Link
        href={ROUTES.OWNER_MARKETPLACE.HREF}
        className="border-border hover:bg-muted rounded-md border px-4 py-2 text-sm font-medium transition-colors">
        Clear
      </Link>
    </form>
  );
}
