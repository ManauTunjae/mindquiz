import type { Metadata } from 'next';
import { Benefits } from '@/components/landing/Benefits';
import { Footer } from '@/components/landing/Footer';
import { Hero } from '@/components/landing/Hero';
import { LandingHeader } from '@/components/landing/LandingHeader';

export const metadata: Metadata = {
  title: { absolute: 'MindQuiz · Friendly quizzes for non-profit organisations' },
  description:
    'Create a short quiz, share it with one link and see what your visitors know. Calm design and privacy built in.',
};

export default function HomePage() {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-30 rounded-xl bg-charcoal px-4 py-2 font-bold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <LandingHeader />
      <main id="main">
        <Hero />
        <Benefits />
      </main>
      <Footer />
    </>
  );
}
