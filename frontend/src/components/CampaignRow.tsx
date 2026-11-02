'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChartColumn,
  ClipboardList,
  Copy,
  EyeOff,
  Link2,
  Pencil,
  Send,
  Trash2,
  Users,
} from 'lucide-react';
import { adminApi, errorMessage, isUnauthorized } from '@/lib/api';
import type { CampaignListItem } from '@/lib/types';
import { Button, buttonClasses } from './ui/button';
import { Card } from './ui/card';
import { IconBubble } from './ui/icon-bubble';
import { StatusBadge } from './StatusBadge';

type Props = {
  campaign: CampaignListItem;
  onChange: (campaign: CampaignListItem) => void;
  onDeleted: (id: string) => void;
};

export function CampaignRow({ campaign, onChange, onDeleted }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const published = campaign.status === 'published';

  // Run an API call. Show the error in this card, or go to login if the session is gone.
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (err) {
      if (isUnauthorized(err)) router.replace('/admin/login');
      else setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const togglePublish = () =>
    run(async () => {
      const { campaign: updated } = await adminApi.updateCampaign(campaign.id, {
        status: published ? 'draft' : 'published',
      });
      onChange({ ...campaign, status: updated.status, updatedAt: updated.updatedAt });
    });

  const remove = () =>
    run(async () => {
      await adminApi.deleteCampaign(campaign.id);
      onDeleted(campaign.id);
    });

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/c/${campaign.slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy the link. Copy it by hand from the link above.');
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <IconBubble icon={ClipboardList} />
        <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <h2 className="font-heading text-lg font-semibold sm:text-xl">{campaign.title}</h2>
          <StatusBadge status={campaign.status} />
        </div>
      </div>

      <dl className="flex flex-col gap-2 text-sm text-charcoal/80">
        <div className="flex items-center gap-2">
          <Users className="size-4 shrink-0" aria-hidden="true" />
          <dt className="font-bold">Participants:</dt>
          <dd>{campaign.participants}</dd>
        </div>
        <div className="flex items-start gap-2">
          <Link2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <dt className="font-bold">Public link:</dt>
          <dd className="min-w-0 break-all">
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

      {error && (
        <p
          role="alert"
          className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {error}
        </p>
      )}

      {confirmingDelete ? (
        <div
          role="group"
          aria-label="Confirm delete"
          className="flex flex-col gap-3 rounded-2xl bg-red-50 p-4"
        >
          <p className="text-sm font-medium text-red-800">
            Delete “{campaign.title}”? This also deletes its questions
            {campaign.participants > 0 ? `, ${campaign.participants} participant(s)` : ''} and all
            leads. You cannot undo this.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="danger" onClick={remove} disabled={busy}>
              <Trash2 className="size-5" aria-hidden="true" />
              {busy ? 'Deleting…' : 'Yes, delete'}
            </Button>
            <Button variant="secondary" onClick={() => setConfirmingDelete(false)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Link href={`/admin/campaigns/${campaign.id}`} className={buttonClasses('secondary')}>
            <ChartColumn className="size-5" aria-hidden="true" />
            Results
          </Link>
          <Link
            href={`/admin/campaigns/${campaign.id}/edit`}
            className={buttonClasses('secondary')}
          >
            <Pencil className="size-5" aria-hidden="true" />
            Edit
          </Link>
          <Button
            variant={published ? 'secondary' : 'primary'}
            onClick={togglePublish}
            disabled={busy}
          >
            {published ? (
              <EyeOff className="size-5" aria-hidden="true" />
            ) : (
              <Send className="size-5" aria-hidden="true" />
            )}
            {published ? 'Unpublish' : 'Publish'}
          </Button>
          <Button variant="secondary" onClick={copyLink}>
            {copied ? (
              <Check className="size-5" aria-hidden="true" />
            ) : (
              <Copy className="size-5" aria-hidden="true" />
            )}
            {copied ? 'Copied!' : 'Copy link'}
          </Button>
          <Button
            variant="danger"
            size="icon"
            aria-label={`Delete ${campaign.title}`}
            title="Delete"
            onClick={() => setConfirmingDelete(true)}
            disabled={busy}
          >
            <Trash2 className="size-5" aria-hidden="true" />
          </Button>
        </div>
      )}
    </Card>
  );
}
