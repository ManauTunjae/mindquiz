'use client';

import { RotateCcw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IconBubble } from '@/components/ui/icon-bubble';

export default function QuizError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <IconBubble icon={TriangleAlert} size="lg" />
      <h1 className="font-heading text-3xl font-semibold">Something went wrong</h1>
      <p className="text-lg text-charcoal/80">We could not load the quiz. Please try again.</p>
      <Button onClick={reset}>
        <RotateCcw className="size-5" aria-hidden="true" />
        Try again
      </Button>
    </main>
  );
}
