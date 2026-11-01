import type { CampaignStatus } from '@/lib/types';

export function StatusBadge({ status }: { status: CampaignStatus }) {
  const published = status === 'published';
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        published ? 'bg-primary-soft text-charcoal' : 'bg-mist text-charcoal'
      }`}
    >
      {published ? 'Published' : 'Draft'}
    </span>
  );
}
