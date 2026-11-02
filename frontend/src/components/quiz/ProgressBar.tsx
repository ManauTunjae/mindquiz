type Props = { current: number; total: number };

// "current" is the number of the question on the screen (1, 2, 3 ...).
export function ProgressBar({ current, total }: Props) {
  const percent = Math.round((current / total) * 100);
  const label = `Question ${current} of ${total}`;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-bold text-charcoal/80">{label}</p>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        className="h-3 w-full overflow-hidden rounded-full bg-mist ring-1 ring-inset ring-charcoal/50"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
