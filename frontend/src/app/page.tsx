import type { Metadata } from 'next';
import { Benefits } from '@/components/landing/Benefits';
import { Footer } from '@/components/landing/Footer';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/how-it-works/HowItWorks';
import { SampleQuiz } from '@/components/landing/SampleQuiz';
import { Section } from '@/components/landing/Section';
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
        <Section
          id="how-it-works"
          eyebrow="How it works"
          title="From idea to results in four steps"
          intro="Create a campaign, add your questions, share the link and see what happened."
        >
          <HowItWorks />
        </Section>
        <Section
          id="try-it"
          eyebrow="Try it"
          title="Answer a sample question"
          intro="This is what your visitors will see: one question at a time, with the right answer at the end."
          className="border-y border-mist/60 bg-surface/70"
        >
          <SampleQuiz />
        </Section>
      </main>
      <Footer />
    </>
  );
}
