'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/StatusBadge';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { adminApi, ApiError, errorMessage, isUnauthorized } from '@/lib/api';
import type { CampaignDetail, CampaignStats, Lead } from '@/lib/types';

type Data = { campaign: CampaignDetail; stats: CampaignStats; leads: Lead[] };

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex flex-col gap-1 p-4 sm:p-5">
      <dt className="text-sm font-bold text-charcoal/80">{label}</dt>
      <dd className="font-serif text-4xl font-semibold">{value}</dd>
    </Card>
  );
}

export default function CampaignDashboardPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([adminApi.getCampaign(id), adminApi.getStats(id), adminApi.listLeads(id)])
      .then(([c, s, l]) => {
        if (!cancelled) setData({ campaign: c.campaign, stats: s.stats, leads: l.leads });
      })
      .catch((err) => {
        if (cancelled) return;
        if (isUnauthorized(err)) router.replace('/admin/login');
        else if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else setError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (notFound) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="font-serif text-3xl font-semibold">Campaign not found</h1>
        <Link href="/admin/campaigns" className={buttonClasses('secondary')}>
          Back to campaigns
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
        {error}
      </p>
    );
  }

  if (!data) return <p className="text-charcoal/70">Loading…</p>;

  const { campaign, stats, leads } = data;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/campaigns"
          className="w-fit text-sm font-bold underline underline-offset-2"
        >
          ← Campaigns
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-serif text-3xl font-semibold">{campaign.title}</h1>
          <StatusBadge status={campaign.status} />
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/admin/campaigns/${campaign.id}/edit`}
            className={buttonClasses('secondary')}
          >
            Edit
          </Link>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Participants" value={String(stats.participants)} />
        <StatCard
          label="Average score"
          value={stats.averageScore === null ? '–' : `${stats.averageScore} of ${stats.total}`}
        />
        <StatCard label="Leads" value={String(leads.length)} />
      </dl>

      {stats.participants === 0 && (
        <Card className="text-center">
          <p className="font-bold">No participants yet</p>
          <p className="mt-1 text-charcoal/80">
            {campaign.status === 'published'
              ? 'Share the public link to get your first answers: '
              : 'Publish the campaign first, then share the public link: '}
            <span className="break-all font-bold">/c/{campaign.slug}</span>
          </p>
        </Card>
      )}
    </div>
  );
}
