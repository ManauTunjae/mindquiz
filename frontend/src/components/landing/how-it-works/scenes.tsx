'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Check, ChevronDown, CircleCheck, CircleHelp, Copy, Link2, Plus } from 'lucide-react';
import { bestTextColour } from '@/lib/contrast';
import { useCountUp, useTyped } from './use-typed';

// The four pictures of the "how it works" demo. They are examples: made-up data, no clicks.
// Every scene gets `reduced`. When it is true, the scene shows its last picture at once.

const SWATCHES = ['#FF7A00', '#2F6FED', '#1F9D6B', '#8B5CF6', '#E5484D'];

function Label({ children }: { children: ReactNode }) {
  return <p className="mb-1.5 text-xs font-bold text-charcoal/70">{children}</p>;
}

function FakeField({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center rounded-xl border border-charcoal/30 bg-surface px-3 text-sm">
      {children}
    </div>
  );
}

// ---------------------------------------------------------------- 1. create a campaign

export function CreateScene({ reduced }: { reduced: boolean }) {
  const title = useTyped('Wellbeing basics', { delay: 400, speed: 55, instant: reduced });
  const [picked, setPicked] = useState(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    const timer = window.setTimeout(() => setPicked(1), 2600);
    return () => window.clearTimeout(timer);
  }, [reduced]);

  const accent = SWATCHES[picked];
  const textColour = bestTextColour(accent)?.colour ?? '#1E1E1E';

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Label>Title</Label>
        <FakeField>
          <span>{title.text}</span>
          {!title.done && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-charcoal" />
          )}
        </FakeField>
      </div>

      <div>
        <Label>Accent colour</Label>
        <div className="flex flex-wrap items-center gap-3">
          {SWATCHES.map((colour, i) => (
            <span
              key={colour}
              style={{ backgroundColor: colour }}
              className={`grid size-9 place-items-center rounded-full transition-shadow duration-300 ${
                i === picked ? 'ring-2 ring-charcoal ring-offset-2' : ''
              }`}
            >
              {i === picked && (
                <Check
                  className="size-4"
                  strokeWidth={3}
                  style={{ color: bestTextColour(colour)?.colour }}
                />
              )}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span
            style={{ backgroundColor: accent, color: textColour }}
            className="rounded-xl px-4 py-2 text-sm font-bold transition-colors duration-500"
          >
            Preview
          </span>
          <span className="text-xs text-charcoal/70">Contrast is checked for you</span>
        </div>
      </div>

      <div>
        <Label>Status</Label>
        <FakeField>
          <span className="flex-1">Draft (not visible to visitors)</span>
          <ChevronDown className="size-4 text-charcoal/60" />
        </FakeField>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- 2. add questions

const ANSWERS = [
  'Regular sleep, movement and time with others',
  'Skipping meals to save time',
  'Avoiding all social contact',
];

export function QuestionsScene({ reduced }: { reduced: boolean }) {
  const [marked, setMarked] = useState(reduced);

  useEffect(() => {
    if (reduced) return;
    const timer = window.setTimeout(() => setMarked(true), 2400);
    return () => window.clearTimeout(timer);
  }, [reduced]);

  const appear = (delay: number) =>
    ({
      initial: reduced ? false : { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { delay: reduced ? 0 : delay, duration: 0.35 },
    }) as const;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-bold">
          <CircleHelp className="size-4" />
          Question 1
        </p>
        <span className="flex gap-1.5">
          <span className="h-2 w-6 rounded-full bg-charcoal" />
          <span className="h-2 w-6 rounded-full bg-mist" />
          <span className="h-2 w-6 rounded-full bg-mist" />
        </span>
      </div>

      <motion.div {...appear(0.2)}>
        <Label>Question text</Label>
        <FakeField>Which of these supports general wellbeing?</FakeField>
      </motion.div>

      <div>
        <Label>Answers (select the correct one)</Label>
        <ul className="flex flex-col gap-2">
          {ANSWERS.map((answer, i) => {
            const correct = marked && i === 0;
            return (
              <motion.li
                key={answer}
                {...appear(0.7 + i * 0.3)}
                className={`flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm transition-colors duration-300 ${
                  correct ? 'border-charcoal bg-primary-soft' : 'border-charcoal/30 bg-surface'
                }`}
              >
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                    correct ? 'border-charcoal bg-charcoal text-white' : 'border-charcoal/60'
                  }`}
                >
                  {correct && <Check className="size-3" strokeWidth={3.5} />}
                </span>
                <span className="flex-1">{answer}</span>
                {correct && (
                  <motion.span
                    initial={reduced ? false : { scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                    className="flex shrink-0 items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold"
                  >
                    <CircleCheck className="size-3" />
                    Correct
                  </motion.span>
                )}
              </motion.li>
            );
          })}
        </ul>
      </div>

      <motion.div
        {...appear(1.8)}
        className="flex w-fit items-center gap-2 rounded-xl border border-charcoal/30 px-3 py-2 text-sm font-bold"
      >
        <Plus className="size-4" />
        Add question
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------- 3. share the link

export function ShareScene({ reduced }: { reduced: boolean }) {
  const [published, setPublished] = useState(reduced);
  const [copied, setCopied] = useState(reduced);

  useEffect(() => {
    if (reduced) return;
    const first = window.setTimeout(() => setPublished(true), 900);
    const second = window.setTimeout(() => setCopied(true), 3000);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(second);
    };
  }, [reduced]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold">Wellbeing basics</p>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors duration-500 ${
            published ? 'bg-primary-soft' : 'bg-mist'
          }`}
        >
          {published ? <CircleCheck className="size-3.5" /> : null}
          {published ? 'Published' : 'Draft'}
        </span>
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={published ? { opacity: 1, y: 0 } : { opacity: reduced ? 1 : 0.35, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2"
      >
        <div className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-charcoal/30 bg-surface px-3 text-sm">
          <Link2 className="size-4 shrink-0 text-charcoal/60" />
          <span className="truncate">/c/wellbeing-basics</span>
        </div>
        <motion.span
          animate={copied && !reduced ? { scale: [1, 0.92, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-charcoal/50 px-3 text-sm font-bold"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? 'Copied!' : 'Copy link'}
        </motion.span>
      </motion.div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 24 }}
        animate={copied ? { opacity: 1, y: 0 } : { opacity: reduced ? 1 : 0, y: reduced ? 0 : 24 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mx-auto w-44 rounded-[1.75rem] border-4 border-charcoal bg-ivory p-3"
      >
        <div className="rounded-2xl bg-surface p-3 shadow-sm">
          <span className="grid size-8 place-items-center rounded-lg bg-primary-soft">
            <CircleHelp className="size-4" />
          </span>
          <p className="mt-2 font-heading text-sm font-semibold leading-tight">Wellbeing basics</p>
          <p className="mt-1 text-[10px] text-charcoal/70">3 questions · About a minute</p>
          <span className="mt-3 grid min-h-8 place-items-center rounded-lg bg-primary text-[11px] font-bold text-on-primary">
            Start quiz
          </span>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------- 4. see the results

function Tile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-mist bg-ivory p-3">
      <p className="text-[11px] font-bold text-charcoal/70">{label}</p>
      <p className="mt-0.5 whitespace-nowrap font-heading text-base font-semibold sm:text-xl">
        {children}
      </p>
    </div>
  );
}

function Bar({
  label,
  percent,
  strong,
  reduced,
  delay,
}: {
  label: string;
  percent: number;
  strong?: boolean;
  reduced: boolean;
  delay: number;
}) {
  return (
    <li>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
        <span>{label}</span>
        <span className="font-bold">{percent}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-mist/70">
        <motion.div
          initial={reduced ? false : { width: '0%' }}
          animate={{ width: `${percent}%` }}
          transition={{ delay: reduced ? 0 : delay, duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${strong ? 'bg-charcoal' : 'bg-charcoal/55'}`}
        />
      </div>
    </li>
  );
}

export function ResultsScene({ reduced }: { reduced: boolean }) {
  const participants = useCountUp(24, { delay: 300, instant: reduced });
  const leads = useCountUp(6, { delay: 500, instant: reduced });

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-2.5">
        <Tile label="Participants">{participants}</Tile>
        <Tile label="Average score">2.4 of 3</Tile>
        <Tile label="Leads">{leads}</Tile>
      </div>

      <div>
        <p className="mb-3 text-sm font-bold">Which of these supports general wellbeing?</p>
        <ul className="flex flex-col gap-3">
          <Bar
            label="Regular sleep, movement and time with others"
            percent={71}
            strong
            reduced={reduced}
            delay={0.8}
          />
          <Bar label="Skipping meals to save time" percent={21} reduced={reduced} delay={1.0} />
          <Bar label="Avoiding all social contact" percent={8} reduced={reduced} delay={1.2} />
        </ul>
      </div>
    </div>
  );
}
