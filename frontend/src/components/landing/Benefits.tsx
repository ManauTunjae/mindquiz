import { ChartColumn, Link2, ListChecks, Palette, ShieldCheck, Trophy } from 'lucide-react';
import { IconBubble } from '../ui/icon-bubble';
import { Section } from './Section';

const benefits = [
  {
    icon: ListChecks,
    title: 'One question at a time',
    text: 'A calm, focused flow that works on any phone. Big buttons and clear text.',
  },
  {
    icon: Trophy,
    title: 'Results right away',
    text: 'Visitors see their score and the right answers at the end, with a small celebration.',
  },
  {
    icon: Palette,
    title: 'Your own colours',
    text: 'Every campaign gets its own accent colour, and the text on it stays easy to read.',
  },
  {
    icon: ChartColumn,
    title: 'See what works',
    text: 'Participants, average score and how people answered every question.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy first',
    text: 'Consent is never pre-ticked, there are no health questions, and leads can be deleted.',
  },
  {
    icon: Link2,
    title: 'Share with one link',
    text: 'Publish a campaign and share its link. Unpublish it whenever you like.',
  },
];

export function Benefits() {
  return (
    <Section
      id="benefits"
      eyebrow="Why MindQuiz"
      title="Everything a short awareness quiz needs"
      intro="No long forms and no clutter. Just a friendly quiz that people finish."
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map(({ icon, title, text }) => (
          <li
            key={title}
            className="rounded-3xl border border-mist/70 bg-surface p-6 shadow-[0_2px_16px_rgba(30,30,30,0.05)] transition-shadow hover:shadow-[0_8px_30px_rgba(30,30,30,0.1)]"
          >
            <IconBubble icon={icon} size="lg" />
            <h3 className="mt-5 font-heading text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-charcoal/80">{text}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
