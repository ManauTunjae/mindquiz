import type { LucideIcon } from 'lucide-react';

type Props = {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizes = {
  sm: { box: 'size-9 rounded-xl', icon: 'size-4.5' },
  md: { box: 'size-11 rounded-2xl', icon: 'size-5.5' },
  lg: { box: 'size-14 rounded-2xl', icon: 'size-7' },
};

// An icon in a soft round box. The icon is decoration only, the text next to it says the same.
export function IconBubble({ icon: Icon, size = 'md', className = '' }: Props) {
  const s = sizes[size];
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center bg-primary-soft text-charcoal ${s.box} ${className}`}
    >
      <Icon className={s.icon} strokeWidth={2} />
    </span>
  );
}
