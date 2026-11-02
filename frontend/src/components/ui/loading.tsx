import { LoaderCircle } from 'lucide-react';

// Shown while data is loading. role="status" makes screen readers say it.
// The spinner stops for people who want less motion.
export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <p role="status" className="flex items-center gap-2.5 text-charcoal/70">
      <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      {label}
    </p>
  );
}
