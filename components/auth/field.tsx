import type { ComponentProps } from 'react';

type FieldProps = {
  label: string;
  name: string;
} & Omit<ComponentProps<'input'>, 'name' | 'className'>;

/** A labelled input, styled against the design tokens. The shared field the lean auth forms are built from. */
export function Field({ label, name, ...rest }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      <input
        name={name}
        {...rest}
        className="border-input bg-card text-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2"
      />
    </label>
  );
}

type SubmitButtonProps = {
  pending: boolean;
  children: string;
};

/** The primary submit button, with a pending label. */
export function SubmitButton({ pending, children }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-primary text-primary-foreground hover:bg-primary-hover rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60">
      {children}
    </button>
  );
}
