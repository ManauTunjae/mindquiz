import { useEffect, useRef } from 'react';
import type { PublicCampaign } from '@/lib/types';

type Props = {
  question: PublicCampaign['questions'][number];
  selectedOptionId: number | null;
  onSelect: (optionId: number) => void;
};

// One question with big answer cards. They are real radio buttons, so the keyboard works.
export function QuestionStep({ question, selectedOptionId, onSelect }: Props) {
  const headingId = `question-${question.id}`;
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move keyboard focus to the new question, so screen reader users hear it.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <fieldset aria-labelledby={headingId} className="flex flex-col gap-5">
      <h2
        id={headingId}
        ref={headingRef}
        tabIndex={-1}
        className="font-serif text-2xl font-semibold leading-snug outline-none sm:text-3xl"
      >
        {question.text}
      </h2>

      <div className="flex flex-col gap-3">
        {question.options.map((option) => (
          <label
            key={option.id}
            className="group flex min-h-14 cursor-pointer items-center gap-4 rounded-2xl border-2 border-mist bg-surface p-4 text-lg transition-colors hover:border-charcoal/50 has-[:checked]:border-charcoal has-[:checked]:bg-primary-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-charcoal"
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              value={option.id}
              checked={selectedOptionId === option.id}
              onChange={() => onSelect(option.id)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-charcoal/60 text-sm font-bold text-white group-has-[:checked]:border-charcoal group-has-[:checked]:bg-charcoal"
            >
              <span className="invisible group-has-[:checked]:visible">✓</span>
            </span>
            <span>{option.text}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
