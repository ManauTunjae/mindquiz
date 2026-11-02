'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CampaignForm } from '@/components/CampaignForm';
import { adminApi } from '@/lib/api';
import { emptyCampaignForm } from '@/lib/campaign-form';

export default function NewCampaignPage() {
  const router = useRouter();
  const [initial] = useState(emptyCampaignForm);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-3xl font-semibold">New campaign</h1>
      <CampaignForm
        initial={initial}
        submitLabel="Create campaign"
        onSubmit={async (data) => {
          await adminApi.createCampaign(data);
          router.push('/admin/campaigns');
        }}
      />
    </div>
  );
}
