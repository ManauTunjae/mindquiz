import Link from 'next/link';
import { ArrowRight, Lock, ShieldCheck, Trash2 } from 'lucide-react';
import { IconBubble } from '../ui/icon-bubble';
import { Section } from './Section';

const points = [
  {
    icon: ShieldCheck,
    title: 'Consent is a choice',
    text: 'The consent box is never ticked for the visitor. We save the exact text they agreed to, and the time.',
  },
  {
    icon: Lock,
    title: 'No health questions',
    text: 'Quiz questions are general knowledge. We never ask about a visitor’s own health, and we never store health data.',
  },
  {
    icon: Trash2,
    title: 'Deletion on request',
    text: 'Visitors can ask to have their details deleted, and an admin can do it with one click.',
  },
];

export function PrivacySection() {
  return (
    <Section
      id="privacy"
      eyebrow="Privacy"
      title="Built to respect your visitors"
      intro="People trust you with their name and e-mail. We keep the rules simple and the data small."
      className="border-y border-mist/60 bg-surface/70"
    >
      <ul className="grid gap-4 md:grid-cols-3">
        {points.map(({ icon, title, text }) => (
          <li key={title} className="rounded-3xl border border-mist/70 bg-ivory p-6">
            <IconBubble icon={icon} size="lg" />
            <h3 className="mt-5 font-heading text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-charcoal/80">{text}</p>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-center">
        <Link
          href="/privacy"
          className="inline-flex items-center gap-2 font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-charcoal"
        >
          Read the privacy page
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </p>
    </Section>
  );
}
