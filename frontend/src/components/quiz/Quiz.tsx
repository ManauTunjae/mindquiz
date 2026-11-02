'use client';

import { useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { ApiError } from '@/lib/api';
import { submitQuiz } from '@/lib/public-api';
import type { PublicCampaign, QuizResult } from '@/lib/types';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { ProgressBar } from './ProgressBar';
import { QuestionStep } from './QuestionStep';
import { ResultCard } from './ResultCard';

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

// Between the parts of the quiz (intro, questions, result): a soft fade.
const phaseVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
};

// Between two questions: slide and fade. direction is 1 for Next and -1 for Back.
const questionVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 32 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -32 }),
};

export function Quiz({ campaign }: { campaign: PublicCampaign }) {
  const { questions } = campaign;
  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [chosen, setChosen] = useState<Record<number, number>>({}); // questionId -> optionId
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<QuizResult | null>(null);

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
    if (isLast) {
      void finish();
    } else {
      setDirection(1);
      setIndex((i) => i + 1);
    }
  }

  function back() {
    setDirection(-1);
    setIndex((i) => i - 1);
  }

  return (
    // "user": when the visitor has "reduce motion" on, slide and scale are turned off.
    // Only soft fades are left.
    <MotionConfig reducedMotion="user">
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-8 sm:py-12">
        <AnimatePresence mode="wait" initial={false}>
          {phase === 'intro' && (
            <motion.div
              key="intro"
              variants={phaseVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
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
            </motion.div>
          )}

          {phase === 'questions' && question && (
            <motion.div
              key="questions"
              variants={phaseVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex flex-col gap-6"
            >
              <ProgressBar current={index + 1} total={questions.length} />

              {/* overflow-hidden keeps the slide inside the screen. The padding and the negative margin
                  give the soft shadow of the card room, so it is not cut off. */}
              <div className="-mx-4 -my-4 overflow-hidden px-4 py-4">
                <AnimatePresence mode="wait" initial={false} custom={direction}>
                  <motion.div
                    key={question.id}
                    custom={direction}
                    variants={questionVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                  >
                    <Card>
                      <QuestionStep
                        question={question}
                        selectedOptionId={selected}
                        onSelect={(optionId) =>
                          setChosen((c) => ({ ...c, [question.id]: optionId }))
                        }
                      />
                    </Card>
                  </motion.div>
                </AnimatePresence>
              </div>

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
                  <Button variant="secondary" onClick={back} disabled={submitting}>
                    Back
                  </Button>
                )}
                <Button
                  className="flex-1"
                  onClick={next}
                  disabled={selected === null || submitting}
                >
                  {submitting ? 'Checking…' : isLast ? 'Finish' : 'Next'}
                </Button>
              </div>
            </motion.div>
          )}

          {phase === 'result' && result && (
            <motion.div
              key="result"
              variants={phaseVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <ResultCard campaign={campaign} result={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}
