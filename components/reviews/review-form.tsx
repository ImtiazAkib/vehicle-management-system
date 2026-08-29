'use client';

import { useActionState } from 'react';

import { createReviewAction, type FormState } from './actions';

const initial: FormState = { error: null };

const selectClassName =
  'w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring';

type ReviewFormProps = {
  targetType: string;
  targetId: string;
  label?: string;
};

export function ReviewForm({ targetType, targetId, label = 'Write a review' }: ReviewFormProps) {
  const [state, formAction, pending] = useActionState(createReviewAction, initial);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-3">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Rating
        <select name="rating" required defaultValue="5" className={selectClassName}>
          {[5, 4, 3, 2, 1].map(value => (
            <option key={value} value={value}>
              {value} star{value === 1 ? '' : 's'}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Comment (optional)
        <textarea
          name="comment"
          rows={2}
          className="border-input bg-card text-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2"
        />
      </label>

      {state.error && <p className="text-destructive text-sm">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-primary text-primary-foreground hover:bg-primary-hover w-fit rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60">
        {pending ? 'Saving…' : label}
      </button>
    </form>
  );
}
