import type { ReactNode } from 'react';

type Props = {
  id: string;
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
  className?: string;
};

// A section of the home page: a small label, a heading, a short intro, and the content.
// scroll-mt keeps the heading below the sticky header when you jump here from the menu.
export function Section({ id, eyebrow, title, intro, children, className = '' }: Props) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`scroll-mt-20 py-14 sm:py-20 ${className}`}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-charcoal/70">{eyebrow}</p>
          <h2
            id={`${id}-heading`}
            className="mt-2 font-heading text-2xl font-bold sm:text-3xl lg:text-4xl"
          >
            {title}
          </h2>
          {intro && <p className="mt-4 text-lg text-charcoal/80">{intro}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}
