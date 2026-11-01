'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { Button } from './ui/button';

// Header with navigation and logout. Not shown on the login page.
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    try {
      await adminApi.logout();
    } finally {
      router.replace('/admin/login');
    }
  }

  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="min-h-screen">
      <header className="border-b border-mist bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/admin/campaigns"
            className="font-serif text-xl font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
          >
            MindQuiz <span className="text-sm font-normal text-charcoal/70">admin</span>
          </Link>
          <Button variant="secondary" onClick={logout}>
            Log out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">{children}</main>
    </div>
  );
}
