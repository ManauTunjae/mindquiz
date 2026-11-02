'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, MotionConfig, motion, useInView, useReducedMotion } from 'motion/react';
import { ChartColumn, ListChecks, Pause, Play, Share2, Sparkles } from 'lucide-react';
import { Button } from '../../ui/button';
import { CreateScene, QuestionsScene, ResultsScene, ShareScene } from './scenes';

const STEPS = [
  {
    icon: Sparkles,
    title: 'Create a campaign',
    text: 'Give it a title and pick your colour. The text on top of it stays readable.',
    window: 'Admin · New campaign',
  },
  {
    icon: ListChecks,
    title: 'Add your questions',
    text: '3 to 5 questions, each with 2 to 4 answers and exactly one correct answer.',
    window: 'Admin · New campaign',
  },
  {
    icon: Share2,
    title: 'Share the link',
    text: 'Publish the campaign and send the link to your visitors. Unpublish it any time.',
    window: 'Admin · Campaigns',
  },
  {
    icon: ChartColumn,
    title: 'See the results',
    text: 'Check how many took part, the average score, and how people answered.',
    window: 'Admin · Results',
  },
];

const noSubscription = () => () => {};

// False while the page is rendered on the server and while React connects it in the browser,
// true after that. The server cannot know if the visitor wants less motion, so the first
// picture in the browser must be the same as the server's. Then it can change.
function useMounted() {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}

function Scene({ step, reduced }: { step: number; reduced: boolean }) {
  if (step === 0) return <CreateScene reduced={reduced} />;
  if (step === 1) return <QuestionsScene reduced={reduced} />;
  if (step === 2) return <ShareScene reduced={reduced} />;
  return <ResultsScene reduced={reduced} />;
}

export function HowItWorks() {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const reduced = useMounted() && prefersReducedMotion;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const [step, setStep] = useState(0);
  // null means "the visitor has not chosen". Then it plays, unless they want less motion.
  const [choice, setChoice] = useState<boolean | null>(null);

  const playing = choice ?? !reduced;
  // The progress bar of the active step is also the timer (6.5 seconds, set in its class).
  // When it ends, we go to the next step, so the bar and the step can never get out of sync.
  // Pausing stops both.
  const running = playing && inView && !reduced;

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={ref}
        className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center lg:gap-12"
      >
        {/* The picture. It is decoration: the steps next to it say the same in words. */}
        <div
          aria-hidden="true"
          className="order-1 select-none overflow-hidden rounded-3xl border border-mist bg-surface shadow-[0_20px_60px_rgba(30,30,30,0.12)] lg:order-2"
        >
          <div className="flex items-center gap-3 border-b border-mist bg-ivory px-4 py-2.5">
            <span className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-mist" />
              <span className="size-2.5 rounded-full bg-mist" />
              <span className="size-2.5 rounded-full bg-mist" />
            </span>
            <span className="flex-1 truncate text-xs font-bold text-charcoal/70">
              {STEPS[step].window}
            </span>
            <span className="rounded-full bg-mist px-2.5 py-0.5 text-[11px] font-bold">
              Example
            </span>
          </div>
          <div className="min-h-[24rem] p-5 sm:p-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                // a new key draws the scene again, also when we learn that the visitor wants less motion
                key={`${step}-${reduced}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <Scene step={step} reduced={reduced} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="order-2 flex flex-col gap-4 lg:order-1">
          <ol className="flex flex-col gap-2">
            {STEPS.map(({ icon: Icon, title, text }, i) => {
              const active = i === step;
              return (
                <li key={title}>
                  <button
                    type="button"
                    onClick={() => setStep(i)}
                    aria-current={active ? 'step' : undefined}
                    className={`relative w-full overflow-hidden rounded-2xl border-2 p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal ${
                      active
                        ? 'border-charcoal bg-surface shadow-[0_8px_30px_rgba(30,30,30,0.08)]'
                        : 'border-transparent hover:bg-surface/70'
                    }`}
                  >
                    <span className="flex items-start gap-4">
                      <span
                        aria-hidden="true"
                        className={`grid size-11 shrink-0 place-items-center rounded-2xl transition-colors ${
                          active ? 'bg-primary text-on-primary' : 'bg-primary-soft'
                        }`}
                      >
                        <Icon className="size-5" />
                      </span>
                      <span className="block">
                        <span className="block text-xs font-bold text-charcoal/70">
                          Step {i + 1}
                        </span>
                        <span className="block font-heading text-base font-semibold">{title}</span>
                        <span className="mt-1 block text-sm text-charcoal/80">{text}</span>
                      </span>
                    </span>

                    {active && !reduced && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 h-1 bg-mist/70"
                      >
                        <span
                          // a new key restarts the bar when the step changes
                          key={step}
                          className="block h-full animate-[step-progress_6500ms_linear_forwards] bg-charcoal"
                          style={{ animationPlayState: running ? 'running' : 'paused' }}
                          onAnimationEnd={(event) => {
                            if (event.animationName === 'step-progress') {
                              setStep((current) => (current + 1) % STEPS.length);
                            }
                          }}
                        />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>

          {/* People who want less motion get a still picture and move through the steps by hand. */}
          {!reduced && (
            <Button
              variant="secondary"
              className="w-full sm:w-fit"
              onClick={() => setChoice(!playing)}
            >
              {playing ? (
                <Pause className="size-5" aria-hidden="true" />
              ) : (
                <Play className="size-5" aria-hidden="true" />
              )}
              {playing ? 'Pause animation' : 'Play animation'}
            </Button>
          )}
        </div>
      </div>
    </MotionConfig>
  );
}
