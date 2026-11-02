// Shown while data is loading. role="status" makes screen readers say it.
// The soft pulse is turned off for people who want less motion.
export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <p role="status" className="animate-pulse text-charcoal/70 motion-reduce:animate-none">
      {label}
    </p>
  );
}
