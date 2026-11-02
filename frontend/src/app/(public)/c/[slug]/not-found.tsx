import Link from 'next/link';
import { buttonClasses } from '@/components/ui/button';

export default function QuizNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <h1 className="font-serif text-3xl font-semibold">This quiz is not available</h1>
      <p className="text-lg text-charcoal/80">
        The link may be wrong, or the quiz is not published right now.
      </p>
      <Link href="/" className={buttonClasses('secondary')}>
        Go to the start page
      </Link>
    </main>
  );
}
