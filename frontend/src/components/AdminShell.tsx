'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { Logo } from './Logo';
import { Button, buttonClasses } from './ui/button';

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

  const onCampaigns = pathname.startsWith('/admin/campaigns');

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-mist bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo href="/admin/campaigns" />
            <span className="hidden rounded-full bg-mist px-2.5 py-0.5 text-xs font-bold sm:inline">
              admin
            </span>
          </div>

          <nav aria-label="Admin" className="flex items-center gap-2">
            <Link
              href="/admin/campaigns"
              aria-current={onCampaigns ? 'page' : undefined}
              className={`${buttonClasses('secondary')} ${onCampaigns ? 'bg-primary-soft' : ''}`}
            >
              <LayoutDashboard className="size-5" aria-hidden="true" />
              <span className="hidden sm:inline">Campaigns</span>
              <span className="sr-only sm:hidden">Campaigns</span>
            </Link>
            <Button variant="secondary" onClick={logout}>
              <LogOut className="size-5" aria-hidden="true" />
              <span className="hidden sm:inline">Log out</span>
              <span className="sr-only sm:hidden">Log out</span>
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">{children}</main>
    </div>
  );
}
