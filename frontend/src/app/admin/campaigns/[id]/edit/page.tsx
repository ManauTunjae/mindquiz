'use client';

import { Pencil } from 'lucide-react';
import { IconBubble } from '@/components/ui/icon-bubble';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CampaignForm } from '@/components/CampaignForm';
import { buttonClasses } from '@/components/ui/button';
import { adminApi, ApiError, errorMessage, isUnauthorized } from '@/lib/api';
import { detailToForm } from '@/lib/campaign-form';
import type { CampaignInput } from '@/lib/types';
import { Loading } from '@/components/ui/loading';

export default function EditCampaignPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [initial, setInitial] = useState<CampaignInput | null>(null);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getCampaign(id)
      .then(({ campaign }) => {
        if (!cancelled) setInitial(detailToForm(campaign));
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
        <h1 className="font-heading text-3xl font-semibold">Campaign not found</h1>
        <Link href="/admin/campaigns" className={buttonClasses('secondary')}>
          Back to campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="flex items-center gap-3 font-heading text-3xl font-semibold">
        <IconBubble icon={Pencil} />
        Edit campaign
      </h1>

      {error && (
        <p
          role="alert"
          className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {error}
        </p>
      )}
      {!error && !initial && <Loading />}

      {initial && (
        <CampaignForm
          initial={initial}
          submitLabel="Save changes"
          onSubmit={async (data) => {
            // Only send the questions if they were changed. Questions cannot be changed
            // after people have answered, but the other fields can always be changed.
            const questionsChanged =
              JSON.stringify(data.questions) !== JSON.stringify(initial.questions);
            const { questions, ...fields } = data;
            await adminApi.updateCampaign(id, questionsChanged ? { ...fields, questions } : fields);
            router.push('/admin/campaigns');
          }}
        />
      )}
    </div>
  );
}
