'use client';

import { useEffect, useState } from 'react';
import { ChartColumn, Check } from 'lucide-react';
import type { CampaignStats } from '@/lib/types';
import { Card } from '../ui/card';
import { IconBubble } from '../ui/icon-bubble';

// How many people chose each answer. The numbers are written as text, and the right answer has
// the words "correct", so nothing depends on colour only.
export function QuestionStats({ stats }: { stats: CampaignStats }) {
  // The bars start at 0 and grow to their size. (With "reduce motion" they appear at once.)
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <section aria-labelledby="answers-heading" className="flex flex-col gap-3">
      <h2
        id="answers-heading"
        className="flex items-center gap-3 font-heading text-2xl font-semibold"
      >
        <IconBubble icon={ChartColumn} size="sm" />
        Answers per question
      </h2>

      <ol className="flex flex-col gap-3">
        {stats.questions.map((question, i) => (
          <li key={question.id}>
            <Card className="flex flex-col gap-4 p-4 sm:p-5">
              <div>
                <p className="font-bold">
                  {i + 1}. {question.text}
                </p>
                <p className="text-sm text-charcoal/70">
                  {question.answered === 0
                    ? 'No answers yet'
                    : `${question.answered} ${question.answered === 1 ? 'answer' : 'answers'}`}
                </p>
              </div>

              <ul className="flex flex-col gap-3">
                {question.options.map((option) => (
                  <li key={option.id} className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="min-w-0">
                        {option.text}
                        {option.isCorrect && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 align-middle text-xs font-bold">
                            <Check className="size-3" aria-hidden="true" />
                            correct
                          </span>
                        )}
                      </p>
                      <p className="shrink-0 text-sm font-bold">
                        {option.count} ({option.percent}%)
                      </p>
                    </div>
                    <div
                      aria-hidden="true"
                      className="h-3 w-full overflow-hidden rounded-full bg-mist/70"
                    >
                      <div
                        className={`h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none ${
                          option.isCorrect ? 'bg-charcoal' : 'bg-charcoal/55'
                        }`}
                        style={{ width: `${grown ? option.percent : 0}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
