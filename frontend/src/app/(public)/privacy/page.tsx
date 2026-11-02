import type { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import { PRIVACY_EMAIL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy · MindQuiz',
  description: 'What we store when you take a quiz, why, and how to ask us to delete it.',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 sm:py-14">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-4xl font-semibold">Privacy</h1>
        <p className="text-lg text-charcoal/80">
          A short and simple explanation of what happens with your data.
        </p>
        <p className="text-sm text-charcoal/70">
          MindQuiz is a practice project and the organisation in the demo is fictional. This page
          shows how a real quiz would handle your data.
        </p>
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-semibold">What we store</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>If you only take the quiz:</strong> your answers and your score. We do not store
            your name, your e-mail address or your IP address, so the answers are not linked to you.
          </li>
          <li>
            <strong>If you choose to send your details:</strong> your name, your e-mail address, the
            time, and the exact text you agreed to.
          </li>
          <li>
            <strong>Health data:</strong> never. The questions are general knowledge questions. We
            never ask about your own health.
          </li>
        </ul>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-semibold">Why we store it</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Quiz answers: to count how many people took the quiz and to see which questions are
            hard.
          </li>
          <li>
            Name and e-mail: only so the organisation can contact you with information about its
            work, and only if you tick the box to agree.
          </li>
        </ul>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-semibold">Who can see it, and for how long</h2>
        <p>
          Only the admins of the organisation can see your details. We do not sell or share them. We
          keep them until you ask us to delete them.
        </p>
        <p>Visitors get no cookies. Only admins use a cookie, to stay logged in.</p>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-semibold">Your rights</h2>
        <p>
          You can withdraw your consent at any time. You can also ask to see, correct or delete your
          details.
        </p>
        <p>
          Write to{' '}
          <a className="font-bold underline underline-offset-2" href={`mailto:${PRIVACY_EMAIL}`}>
            {PRIVACY_EMAIL}
          </a>{' '}
          and use the same e-mail address that you gave in the quiz, so we can find your details. We
          will delete your name and e-mail address. The quiz answers stay, but without your details
          they are not linked to you.
        </p>
      </Card>
    </main>
  );
}
