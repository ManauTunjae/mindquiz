import { CircleCheck, FilePen } from 'lucide-react';
import type { CampaignStatus } from '@/lib/types';

export function StatusBadge({ status }: { status: CampaignStatus }) {
  const published = status === 'published';
  const Icon = published ? CircleCheck : FilePen;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
        published ? 'bg-primary-soft text-charcoal' : 'bg-mist text-charcoal'
      }`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {published ? 'Published' : 'Draft'}
    </span>
  );
}
