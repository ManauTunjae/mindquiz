import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

type CommonProps = { label: string; error?: string; hint?: string };

const fieldClasses =
  'w-full rounded-2xl border bg-surface px-4 py-3 text-base text-charcoal ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal';

function borderFor(error?: string) {
  return error ? 'border-red-800' : 'border-charcoal/50';
}

function Wrapper({
  id,
  label,
  error,
  hint,
  children,
}: CommonProps & { id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-sm text-charcoal/70">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  label,
  error,
  hint,
  className = '',
  ...props
}: CommonProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} error={error} hint={hint}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${fieldClasses} min-h-12 ${borderFor(error)} ${className}`}
        {...props}
      />
    </Wrapper>
  );
}

export function TextArea({
  label,
  error,
  hint,
  className = '',
  ...props
}: CommonProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${fieldClasses} min-h-24 ${borderFor(error)} ${className}`}
        {...props}
      />
    </Wrapper>
  );
}
