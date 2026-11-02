'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  ArrowRight,
  CircleCheck,
  CircleX,
  Info,
  Lightbulb,
  LogIn,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import { Button, buttonClasses } from '../ui/button';
import { Card } from '../ui/card';
import { IconBubble } from '../ui/icon-bubble';

// General knowledge questions only. We never ask visitors about their own health.
// The correct answer is not always the first one.
const QUESTIONS = [
  {
    text: 'Which of these is a common way to support general wellbeing?',
    options: [
      'Skipping meals to save time',
      'Avoiding all social contact',
      'Regular sleep, movement and time with other people',
    ],
    correct: 2,
    explanation: 'Sleep, movement and connection are basic building blocks of wellbeing.',
  },
  {
    text: 'If a friend says they feel low, what is a helpful first step?',
    options: [
      'Listen without judging and show that you care',
      'Tell them to just cheer up',
      'Change the subject',
    ],
    correct: 0,
    explanation: 'Listening shows that you care and gives your friend room to talk.',
  },
  {
    text: 'What does "mental health awareness" mean?',
    options: [
      'Diagnosing other people',
      'Knowing that mental health matters and talking about it openly',
      'Keeping the topic secret',
    ],
    correct: 1,
    explanation: 'Awareness starts with an open, kind conversation.',
  },
];

function resultMessage(score: number, total: number) {
  if (score === total) return 'Great job! Every answer was right.';
  if (score * 2 >= total) return 'Nice work! You know quite a lot about this.';
  return 'Thanks for trying it. Every question is a chance to learn something new.';
}

export function SampleQuiz() {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const userHasActed = useRef(false); // do not move focus when the page loads

  const question = QUESTIONS[index];
  const answered = picked !== null;
  const isLast = index === QUESTIONS.length - 1;

  // After the visitor moves on, put keyboard focus on the new heading. This runs when the new
  // question has finished fading in, because only then is its heading on the page.
  function focusHeading() {
    if (userHasActed.current) headingRef.current?.focus({ preventScroll: true });
  }

  function choose(i: number) {
    if (answered) return;
    userHasActed.current = true;
    setPicked(i);
    if (i === question.correct) setScore((s) => s + 1);
  }

  function next() {
    userHasActed.current = true;
    if (isLast) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setPicked(null);
    }
  }

  function restart() {
    userHasActed.current = true;
    setIndex(0);
    setPicked(null);
    setScore(0);
    setFinished(false);
  }

  return (
    <MotionConfig reducedMotion="user">
      <Card className="mx-auto w-full max-w-2xl p-5 sm:p-8">
        <AnimatePresence mode="wait" initial={false}>
          {finished ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onAnimationComplete={focusHeading}
              className="flex flex-col items-center gap-4 py-4 text-center"
            >
              <IconBubble icon={Trophy} size="lg" />
              <h3
                ref={headingRef}
                tabIndex={-1}
                className="font-heading text-2xl font-bold outline-none sm:text-3xl"
              >
                You got {score} of {QUESTIONS.length}
              </h3>
              <p className="max-w-md text-lg text-charcoal/80">
                {resultMessage(score, QUESTIONS.length)}
              </p>
              <p className="max-w-md text-charcoal/80">
                This is what your visitors will see. Ready to make a quiz of your own?
              </p>
              <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Link
                  href="/admin/login"
                  className={`${buttonClasses('primary')} w-full sm:w-auto`}
                >
                  <LogIn className="size-5" aria-hidden="true" />
                  Admin login
                </Link>
                <Button variant="secondary" className="w-full sm:w-auto" onClick={restart}>
                  <RotateCcw className="size-5" aria-hidden="true" />
                  Try again
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onAnimationComplete={focusHeading}
              className="flex flex-col gap-5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-charcoal/80">
                  Question {index + 1} of {QUESTIONS.length}
                </p>
                <div aria-hidden="true" className="flex gap-1.5">
                  {QUESTIONS.map((_, i) => (
                    <span
                      key={i}
                      className={`h-2 w-8 rounded-full ${i <= index ? 'bg-charcoal' : 'bg-mist'}`}
                    />
                  ))}
                </div>
              </div>

              <h3
                ref={headingRef}
                tabIndex={-1}
                className="font-heading text-xl font-semibold leading-snug outline-none sm:text-2xl"
              >
                {question.text}
              </h3>

              <ul className="flex flex-col gap-3">
                {question.options.map((option, i) => {
                  const isCorrect = i === question.correct;
                  const isPicked = i === picked;
                  const wrongPick = answered && isPicked && !isCorrect;

                  let style = 'border-mist bg-surface hover:border-charcoal/50';
                  if (answered && isCorrect) style = 'border-charcoal bg-primary-soft';
                  else if (wrongPick) style = 'border-red-800 bg-red-50';
                  else if (answered) style = 'border-mist bg-surface opacity-70';

                  return (
                    <li key={option}>
                      <button
                        type="button"
                        onClick={() => choose(i)}
                        aria-disabled={answered}
                        className={`flex min-h-14 w-full items-center gap-4 rounded-2xl border-2 p-4 text-left text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal ${style} ${
                          answered ? 'cursor-default' : 'cursor-pointer'
                        }`}
                      >
                        {/* An empty ring before the answer, a check or a cross after it */}
                        <span
                          aria-hidden="true"
                          className="grid size-7 shrink-0 place-items-center"
                        >
                          {answered && isCorrect ? (
                            <CircleCheck className="size-7 text-charcoal" />
                          ) : wrongPick ? (
                            <CircleX className="size-7 text-red-800" />
                          ) : (
                            <span className="size-7 rounded-full border-2 border-charcoal/60" />
                          )}
                        </span>
                        <span className="flex-1">{option}</span>
                        {answered && isCorrect && (
                          <span className="shrink-0 text-sm font-bold">Correct</span>
                        )}
                        {wrongPick && (
                          <span className="shrink-0 text-sm font-bold text-red-800">Not quite</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div aria-live="polite" className="min-h-6">
                {answered && (
                  <p className="flex items-start gap-2.5 rounded-2xl bg-primary-soft px-4 py-3 text-sm">
                    <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>
                      <span className="font-bold">
                        {picked === question.correct ? 'Correct! ' : 'Not quite. '}
                      </span>
                      {question.explanation}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-sm text-charcoal/70">
                  <Info className="size-4 shrink-0" aria-hidden="true" />
                  Sample questions. Nothing is saved.
                </p>
                <Button onClick={next} disabled={!answered}>
                  {isLast ? 'See my result' : 'Next question'}
                  <ArrowRight className="size-5" aria-hidden="true" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </MotionConfig>
  );
}
