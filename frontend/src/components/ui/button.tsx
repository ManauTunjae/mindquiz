import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
// "icon" is a square button with only an icon. Give it an aria-label.
export type ButtonSize = 'md' | 'icon';

const base =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl text-base font-bold ' +
  'transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-charcoal disabled:cursor-not-allowed disabled:opacity-50';

const sizes: Record<ButtonSize, string> = {
  md: 'px-5',
  icon: 'size-12 shrink-0',
};

// Dark text on orange: white on #FF7A00 is only about 2.6:1, dark text gives about 6.4:1.
const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary shadow-sm hover:brightness-95',
  secondary: 'border border-charcoal/50 bg-surface text-charcoal hover:bg-primary-soft',
  danger: 'border border-red-800 bg-surface text-red-800 hover:bg-red-50',
};

// Use this on a <Link> to make it look like a button.
export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md') {
  return `${base} ${sizes[size]} ${variants[variant]}`;
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}: Props) {
  return (
    <button type={type} className={`${buttonClasses(variant, size)} ${className}`} {...props} />
  );
}
