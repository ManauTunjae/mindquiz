'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { CircleCheck, CircleX, Lightbulb, ListChecks, Trophy } from 'lucide-react';
import type { PublicCampaign, QuizResult } from '@/lib/types';
import { Card } from '../ui/card';
import { IconBubble } from '../ui/icon-bubble';
import { fireConfetti } from './confetti';
import { LeadForm } from './LeadForm';

type Props = { campaign: PublicCampaign; result: QuizResult };

// A calm message for every score. We never say that someone failed.
function messageFor(score: number, total: number): string {
  if (score === total) return 'Great job! Every answer was right.';
  if (score * 2 >= total) return 'Nice work! You know quite a lot about this.';
  return 'Thanks for taking the quiz. Every question is a chance to learn something new.';
}

export function ResultCard({ campaign, result }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  const confettiFired = useRef(false);

  // Move focus to the result, so screen reader users hear it, and start the confetti once.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    if (!confettiFired.current) {
      confettiFired.current = true;
      void fireConfetti(campaign.accentColor);
    }
  }, [campaign.accentColor]);

  const optionText = (questionId: number, optionId: number) =>
    campaign.questions.find((q) => q.id === questionId)?.options.find((o) => o.id === optionId)
      ?.text ?? '';

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <Card className="flex flex-col items-center gap-3 text-center">
          <IconBubble icon={Trophy} size="lg" />
          <p className="text-sm font-bold text-charcoal/80">Your result</p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-heading text-3xl font-semibold outline-none sm:text-4xl"
          >
            You got {result.score} of {result.total}
          </h1>
          <p className="text-lg text-charcoal/80">{messageFor(result.score, result.total)}</p>
        </Card>
      </motion.div>

      <motion.section
        aria-labelledby="review-heading"
        className="flex flex-col gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <h2
          id="review-heading"
          className="flex items-center gap-3 font-heading text-2xl font-semibold"
        >
          <IconBubble icon={ListChecks} size="sm" />
          Your answers
        </h2>
        <ol className="flex flex-col gap-3">
          {result.results.map((r, i) => {
            const question = campaign.questions.find((q) => q.id === r.questionId);
            const right = r.chosenOptionId === r.correctOptionId;
            return (
              <li key={r.questionId}>
                <Card className="flex flex-col gap-2 p-4 sm:p-5">
                  <p className="font-bold">
                    {i + 1}. {question?.text}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="inline-flex items-center gap-1.5 font-bold">
                      {right ? (
                        <CircleCheck className="size-5" aria-hidden="true" />
                      ) : (
                        <CircleX className="size-5" aria-hidden="true" />
                      )}
                      {right ? 'Correct' : 'Not quite'}
                    </span>
                    <span className="text-charcoal/80">
                      · Your answer: {optionText(r.questionId, r.chosenOptionId)}
                    </span>
                  </p>
                  {!right && (
                    <p className="flex items-start gap-2 rounded-2xl bg-primary-soft px-3 py-2 text-sm">
                      <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      <span>
                        <span className="font-bold">Correct answer:</span>{' '}
                        {optionText(r.questionId, r.correctOptionId)}
                      </span>
                    </p>
                  )}
                </Card>
              </li>
            );
          })}
        </ol>
      </motion.section>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <LeadForm submissionId={result.submissionId} consentText={campaign.consentText} />
      </motion.div>
    </div>
  );
}
