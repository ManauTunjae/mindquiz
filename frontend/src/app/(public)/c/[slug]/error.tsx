'use client';

import { Button } from '@/components/ui/button';

export default function QuizError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <h1 className="font-heading text-3xl font-semibold">Something went wrong</h1>
      <p className="text-lg text-charcoal/80">We could not load the quiz. Please try again.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
