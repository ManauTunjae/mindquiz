import Link from 'next/link';
import { buttonClasses } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <h1 className="font-heading text-3xl font-semibold">Page not found</h1>
      <p className="text-lg text-charcoal/80">We could not find the page you are looking for.</p>
      <Link href="/" className={buttonClasses('secondary')}>
        Go to the start page
      </Link>
    </main>
  );
}
