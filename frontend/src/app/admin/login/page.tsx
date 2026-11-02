'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogIn, Lock, Mail } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { adminApi, errorMessage } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in? Go straight to the campaigns.
  useEffect(() => {
    let cancelled = false;
    adminApi
      .me()
      .then(() => {
        if (!cancelled) router.replace('/admin/campaigns');
      })
      .catch(() => {
        // Not logged in: stay on this page
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminApi.login(email, password);
      router.replace('/admin/campaigns');
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="flex flex-col items-center gap-5 text-center">
        <Logo />
        <div>
          <h1 className="font-heading text-3xl font-semibold">Admin login</h1>
          <p className="mt-2 text-charcoal/80">Log in to manage your campaigns.</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <TextField
            label="E-mail"
            icon={Mail}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            icon={Lock}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p
              role="alert"
              className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
            >
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading || !email || !password}>
            <LogIn className="size-5" aria-hidden="true" />
            {loading ? 'Logging in…' : 'Log in'}
          </Button>
        </form>
      </Card>

      <Link
        href="/"
        className="mx-auto inline-flex items-center gap-2 text-sm font-bold underline underline-offset-2"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to the home page
      </Link>
    </main>
  );
}
