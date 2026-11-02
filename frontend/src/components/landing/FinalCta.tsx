import Link from 'next/link';
import { LogIn, Sparkles } from 'lucide-react';
import { buttonClasses } from '../ui/button';
import { IconBubble } from '../ui/icon-bubble';

export function FinalCta() {
  return (
    <section aria-labelledby="cta-heading" className="py-14 sm:py-20">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-5 rounded-[2rem] bg-primary-soft px-6 py-12 text-center sm:px-12">
          <IconBubble icon={Sparkles} size="lg" className="bg-surface" />
          <h2 id="cta-heading" className="font-heading text-2xl font-bold sm:text-3xl lg:text-4xl">
            Ready to make your first quiz?
          </h2>
          <p className="max-w-xl text-lg text-charcoal/80">
            This is a practice project. Log in to the admin area to create a campaign, add your
            questions and share the link.
          </p>
          <Link href="/admin/login" className={`${buttonClasses('primary')} mt-2`}>
            <LogIn className="size-5" aria-hidden="true" />
            Admin login
          </Link>
        </div>
      </div>
    </section>
  );
}
