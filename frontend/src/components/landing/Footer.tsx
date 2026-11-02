import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { Logo } from '../Logo';

export function Footer() {
  return (
    <footer className="border-t border-mist bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-md text-sm text-charcoal/70">
            MindQuiz is a practice project. The organisation, the quizzes and the contact details on
            this site are fictional.
          </p>
        </div>

        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-bold"
        >
          <Link
            href="/privacy"
            className="inline-flex items-center gap-2 underline underline-offset-4"
          >
            <ShieldCheck className="size-4" aria-hidden="true" />
            Privacy
          </Link>
          <Link href="/admin/login" className="underline underline-offset-4">
            Admin login
          </Link>
        </nav>
      </div>
    </footer>
  );
}
