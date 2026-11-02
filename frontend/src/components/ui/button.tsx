import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

const base =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-base font-bold ' +
  'transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-charcoal disabled:cursor-not-allowed disabled:opacity-50';

// Dark text on orange: white on #FF7A00 is only about 2.6:1, dark text gives about 6.4:1.
const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary shadow-sm hover:brightness-95',
  secondary: 'border border-charcoal/50 bg-surface text-charcoal hover:bg-primary-soft',
  danger: 'border border-red-800 bg-surface text-red-800 hover:bg-red-50',
};

// Use this on a <Link> to make it look like a button.
export function buttonClasses(variant: ButtonVariant = 'primary') {
  return `${base} ${variants[variant]}`;
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant };

export function Button({ variant = 'primary', className = '', type = 'button', ...props }: Props) {
  return <button type={type} className={`${buttonClasses(variant)} ${className}`} {...props} />;
}
