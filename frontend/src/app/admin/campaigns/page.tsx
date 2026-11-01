'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CampaignRow } from '@/components/CampaignRow';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { adminApi, errorMessage, isUnauthorized } from '@/lib/api';
import type { CampaignListItem } from '@/lib/types';

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignListItem[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    adminApi
      .listCampaigns()
      .then((data) => {
        if (!cancelled) setCampaigns(data.campaigns);
      })
      .catch((err) => {
        if (cancelled) return;
        if (isUnauthorized(err)) router.replace('/admin/login');
        else setError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">Campaigns</h1>
        <Link href="/admin/campaigns/new" className={buttonClasses('primary')}>
          New campaign
        </Link>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {error}
        </p>
      )}

      {!error && campaigns === null && <p className="text-charcoal/70">Loading…</p>}

      {campaigns?.length === 0 && (
        <Card className="text-center">
          <p className="font-bold">No campaigns yet</p>
          <p className="mt-1 text-charcoal/80">Create your first quiz with the button above.</p>
        </Card>
      )}

      {campaigns?.map((campaign) => (
        <CampaignRow key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}
