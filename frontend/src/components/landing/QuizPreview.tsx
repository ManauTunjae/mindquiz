import { Check, Trophy } from 'lucide-react';

// A picture of what a visitor sees, built with the same styles as the real quiz.
// It is only decoration: it cannot be clicked, and screen readers skip it.
export function QuizPreview() {
  const options = [
    { text: 'Skipping meals to save time', selected: false },
    { text: 'Regular sleep, movement and time with others', selected: true },
    { text: 'Avoiding all social contact', selected: false },
  ];

  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      <div className="rounded-[2rem] border border-mist bg-ivory p-4 shadow-[0_20px_60px_rgba(30,30,30,0.12)] sm:p-5">
        <div className="mb-4 flex flex-col gap-2 px-1">
          <p className="text-xs font-bold text-charcoal/80">Question 2 of 3</p>
          <div className="h-3 w-full overflow-hidden rounded-full bg-mist ring-1 ring-inset ring-charcoal/50">
            <div className="h-full w-2/3 rounded-full bg-primary" />
          </div>
        </div>

        <div className="rounded-3xl bg-surface p-4 shadow-[0_2px_16px_rgba(30,30,30,0.06)] sm:p-5">
          <p className="font-heading text-lg font-semibold leading-snug">
            Which of these supports general wellbeing?
          </p>
          <div className="mt-4 flex flex-col gap-2.5">
            {options.map((option) => (
              <div
                key={option.text}
                className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-sm ${
                  option.selected ? 'border-charcoal bg-primary-soft' : 'border-mist bg-surface'
                }`}
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${
                    option.selected
                      ? 'border-charcoal bg-charcoal text-white'
                      : 'border-charcoal/60'
                  }`}
                >
                  {option.selected && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                {option.text}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid min-h-12 place-items-center rounded-2xl bg-primary px-5 text-base font-bold text-on-primary shadow-sm">
          Next
        </div>
      </div>

      <div className="absolute -bottom-5 -left-2 flex items-center gap-2 rounded-2xl border border-mist bg-surface px-4 py-2.5 text-sm font-bold shadow-[0_8px_30px_rgba(30,30,30,0.12)] sm:-left-6">
        <span className="grid size-8 place-items-center rounded-xl bg-primary-soft">
          <Trophy className="size-4.5" />
        </span>
        You got 3 of 3
      </div>
    </div>
  );
}
