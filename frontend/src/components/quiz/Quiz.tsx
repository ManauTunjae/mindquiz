'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/api';
import { submitQuiz } from '@/lib/public-api';
import type { PublicCampaign, QuizResult } from '@/lib/types';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { ProgressBar } from './ProgressBar';
import { QuestionStep } from './QuestionStep';

type Phase = 'intro' | 'questions' | 'result';

// Short messages a visitor understands (not technical ones).
function friendlyError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 0)
      return 'We could not reach the server. Please check your connection and try again.';
    if (err.status === 404) return 'This quiz is not available any more.';
    if (err.status === 429) return 'Too many tries. Please wait a few minutes and try again.';
  }
  return 'Something went wrong. Please try again.';
}

export function Quiz({ campaign }: { campaign: PublicCampaign }) {
  const { questions } = campaign;
  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<Record<number, number>>({}); // questionId -> optionId
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<QuizResult | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move keyboard focus to the new question, so screen reader users hear it.
  useEffect(() => {
    if (phase === 'questions') headingRef.current?.focus();
  }, [phase, index]);

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const selected = question ? (chosen[question.id] ?? null) : null;

  async function finish() {
    setError('');
    setSubmitting(true);
    try {
      const answers = questions.map((q) => ({ questionId: q.id, optionId: chosen[q.id] }));
      setResult(await submitQuiz(campaign.slug, answers));
      setPhase('result');
    } catch (err) {
      setError(friendlyError(err)); // the answers stay, so the visitor can try again
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    if (isLast) void finish();
    else setIndex((i) => i + 1);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-4 py-8 sm:py-12">
      {phase === 'intro' && (
        <Card className="flex flex-col gap-5">
          <h1 className="font-serif text-3xl font-semibold">{campaign.title}</h1>
          {campaign.description && (
            <p className="text-lg text-charcoal/80">{campaign.description}</p>
          )}
          {questions.length > 0 ? (
            <>
              <p className="text-sm font-bold text-charcoal/80">
                {questions.length} questions · takes about a minute
              </p>
              <Button onClick={() => setPhase('questions')}>Start quiz</Button>
            </>
          ) : (
            <p>This quiz has no questions yet.</p>
          )}
        </Card>
      )}

      {phase === 'questions' && question && (
        <>
          <ProgressBar current={index + 1} total={questions.length} />
          <Card>
            <QuestionStep
              question={question}
              selectedOptionId={selected}
              onSelect={(optionId) => setChosen((c) => ({ ...c, [question.id]: optionId }))}
              headingRef={headingRef}
            />
          </Card>

          {error && (
            <p
              role="alert"
              className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
            >
              {error}
            </p>
          )}

          <div className="flex gap-3">
            {index > 0 && (
              <Button
                variant="secondary"
                onClick={() => setIndex((i) => i - 1)}
                disabled={submitting}
              >
                Back
              </Button>
            )}
            <Button className="flex-1" onClick={next} disabled={selected === null || submitting}>
              {submitting ? 'Checking…' : isLast ? 'Finish' : 'Next'}
            </Button>
          </div>
        </>
      )}

      {phase === 'result' && result && (
        <Card aria-live="polite">
          <h1 className="font-serif text-3xl font-semibold">
            You got {result.score} of {result.total}
          </h1>
        </Card>
      )}
    </main>
  );
}
