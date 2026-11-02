import Link from 'next/link';
import { MessageCircleQuestion } from 'lucide-react';

type Props = {
  href?: string;
  className?: string;
};

// The word mark: a small icon in a rounded square, and the name in IBM Plex Mono.
export function Logo({ href = '/', className = '' }: Props) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-charcoal ${className}`}
    >
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-on-primary shadow-sm">
        <MessageCircleQuestion className="size-5" strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span className="font-heading text-xl font-bold tracking-tight">MindQuiz</span>
    </Link>
  );
}
