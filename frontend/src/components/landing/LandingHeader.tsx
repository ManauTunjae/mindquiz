import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { Logo } from '../Logo';
import { buttonClasses } from '../ui/button';

const links = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#try-it', label: 'Try it' },
  { href: '#privacy', label: 'Privacy' },
];

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-mist/70 bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md text-sm font-bold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-charcoal"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <Link href="/admin/login" className={buttonClasses('primary')}>
          <LogIn className="size-5" aria-hidden="true" />
          Admin login
        </Link>
      </div>
    </header>
  );
}
