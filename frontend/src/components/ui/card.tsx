import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-3xl bg-surface p-5 shadow-[0_2px_16px_rgba(30,30,30,0.06)] sm:p-6 ${className}`}
      {...props}
    />
  );
}
