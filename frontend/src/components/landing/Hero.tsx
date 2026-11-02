import Link from 'next/link';
import { ArrowDown, LogIn, Palette, ShieldCheck, Sparkles, ListChecks } from 'lucide-react';
import { buttonClasses } from '../ui/button';
import { QuizPreview } from './QuizPreview';

const points = [
  { icon: ListChecks, text: '3 to 5 questions' },
  { icon: Palette, text: 'Your own colours' },
  { icon: ShieldCheck, text: 'GDPR consent built in' },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-heading">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_80%_-10%,var(--color-primary-soft),transparent_70%)]"
      />
      <div className="mx-auto grid w-full max-w-6xl gap-14 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-2 md:items-center md:gap-10 md:py-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3.5 py-1.5 text-sm font-bold">
            <Sparkles className="size-4" aria-hidden="true" />
            For non-profit organisations
          </p>
          <h1
            id="hero-heading"
            className="mt-5 font-heading text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
          >
            Friendly quizzes that raise awareness
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-charcoal/80">
            Create a short quiz, share it with one link, and see what your visitors know. A calm
            design, one question at a time, and privacy built in from the start.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/admin/login" className={buttonClasses('primary')}>
              <LogIn className="size-5" aria-hidden="true" />
              Admin login
            </Link>
            <a href="#how-it-works" className={buttonClasses('secondary')}>
              See how it works
              <ArrowDown className="size-5" aria-hidden="true" />
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-charcoal/80">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <Icon className="size-4.5" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <QuizPreview />
      </div>
    </section>
  );
}
