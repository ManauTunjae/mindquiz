import Link from 'next/link';
import type { CampaignListItem } from '@/lib/types';
import { buttonClasses } from './ui/button';
import { Card } from './ui/card';
import { StatusBadge } from './StatusBadge';

export function CampaignRow({ campaign }: { campaign: CampaignListItem }) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="font-serif text-xl font-semibold">{campaign.title}</h2>
        <StatusBadge status={campaign.status} />
      </div>

      <dl className="flex flex-col gap-1 text-sm text-charcoal/80">
        <div className="flex gap-2">
          <dt className="font-bold">Participants:</dt>
          <dd>{campaign.participants}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-bold">Public link:</dt>
          <dd className="break-all">
            <Link
              href={`/c/${campaign.slug}`}
              target="_blank"
              className="underline underline-offset-2"
            >
              /c/{campaign.slug}
            </Link>
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-3">
        <Link href={`/admin/campaigns/${campaign.id}/edit`} className={buttonClasses('secondary')}>
          Edit
        </Link>
      </div>
    </Card>
  );
}
