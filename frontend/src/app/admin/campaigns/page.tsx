'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles } from 'lucide-react';
import { CampaignRow } from '@/components/CampaignRow';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBubble } from '@/components/ui/icon-bubble';
import { adminApi, errorMessage, isUnauthorized } from '@/lib/api';
import type { CampaignListItem } from '@/lib/types';
import { Loading } from '@/components/ui/loading';

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
        <h1 className="font-heading text-3xl font-semibold">Campaigns</h1>
        <Link href="/admin/campaigns/new" className={buttonClasses('primary')}>
          <Plus className="size-5" aria-hidden="true" />
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

      {!error && campaigns === null && <Loading />}

      {campaigns?.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <IconBubble icon={Sparkles} size="lg" />
          <p className="font-heading text-xl font-semibold">No campaigns yet</p>
          <p className="max-w-sm text-charcoal/80">
            Create your first quiz: give it a title, pick a colour and add 3 to 5 questions.
          </p>
          <Link href="/admin/campaigns/new" className={buttonClasses('primary')}>
            <Plus className="size-5" aria-hidden="true" />
            Create your first campaign
          </Link>
        </Card>
      )}

      {campaigns?.map((campaign) => (
        <CampaignRow
          key={campaign.id}
          campaign={campaign}
          onChange={(updated) =>
            setCampaigns((list) => list && list.map((c) => (c.id === updated.id ? updated : c)))
          }
          onDeleted={(id) => setCampaigns((list) => list && list.filter((c) => c.id !== id))}
        />
      ))}
    </div>
  );
}
